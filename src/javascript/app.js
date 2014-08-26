Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'display_box', layout: 'hbox'},
        {xtype:'container',itemId:'card_box'},
        {xtype:'tsinfolink'}
    ],
    launch: function() {
        this.logger.log(this.getContext().getWorkspace(), this.getContext().getProject());
        this.iterationDropdown = this.down('#display_box').add({
            xtype: 'rallyiterationcombobox',
            margin: 10,
            listeners: {
                scope:this,
                change: function(cb,newValue,oldValue){
                    this.displayCards(newValue);
                }
            }
        });
        
        var button = this.down('#display_box').add({
            xtype: 'button',
            text: 'Print Defect Cards',
            margin: 10,
            scope:this,
            handler: function(){
                this.printPop();
            }
        }); 
        
//        this.down('#display_box').add({
//            xtype: 'button',
//            text: 'Save Defect Cards as PDF',
//            margin: 10,
//            scope:this,
//            handler: function(){
//                this.savePDF();
//            }
//              
//        });
    },
   displayCards: function(iterationValue) {
            var estimate, loginName, ownerClass, storyId, taskId, description,
                    i, name, data, userTable, ownerText;
            var MAX_NAME_LEN = 115;
            this.logger.log('displayCards',iterationValue);
            var theMarkup = '';
            this.down('#card_box').update(theMarkup);
            
            this.loadArtifactStore(iterationValue).then({
                scope: this,
                success: function(data){
                    this.logger.log(data.length);
                    for (var i = 0; i < data.length; i++) {
                        this.logger.log(data[i]);
                        name = data[i].get('Name');
                        if (name.length > MAX_NAME_LEN) {
                            name = name.substring(0, MAX_NAME_LEN);
                            name += "...";
                        }
                        loginName = data[i].get('Owner');
                        if (typeof loginName === 'undefined' || loginName === null) {
                            ownerClass = "NoOwner";
                            ownerText = "No Owner";
                            ownerImage = this.getUserImage();
                        } else {
                            ownerClass = loginName.UserName.replace(/[@|\.]/g, "");
                            ownerText = loginName.DisplayName; //makeOwnerText(loginName, userTable);
                            ownerImage = this.getUserImage(loginName);
                        }
                        storyId = data[i].get('FormattedID');

                        if (data[i].get('PlanEstimate')) {
                            estimate = data[i].get('PlanEstimate');
                        } else if (data[i].get('Estimate')) {
                            estimate = data[i].get('Estimate');
                        } else {
                            estimate = "None";
                        }
                        description = data[i].get('Description');
            
                        theMarkup += this.createMarkup(i, data.length, name, ownerText, ownerClass, ownerImage, description,
                                storyId, estimate);
                        
                        this.down('#card_box').update(theMarkup); 
                    }
                },
                failure: function(error){
                    alert(error);
                }
            });
        },
        loadArtifactStore: function(iterationValue){
            this.logger.log('loadArtifactStore');
            var deferred = Ext.create('Deft.Deferred');
            
            var store = Ext.create('Rally.data.wsapi.Store', {
                model: 'Defect',
                autoLoad: true,
                context: {project: null},
                listeners: {
                    scope: this,

                    load: function(store, data, success) {
                        //process data
                        this.logger.log(store,data,success);
                        if (success){
                            deferred.resolve(data);
                        } else {
                            deferred.reject ('Failed to load artifacts.');
                        }
                    }
                },
                fetch: ['Name','Iteration','Owner','FormattedID','PlanEstimate','ObjectID','Description','UserName','DisplayName'],
                filters: [{
                          property: 'Iteration',
                          value: iterationValue 
                }],
                sorters: [{
                    property: 'DragAndDropRank',
                    direction: 'ASC'
                }]
            });
            return deferred.promise;
        },
//    here is something john wrote
        createMarkup: function(cardNum, totalCards, name, ownerText, ownerClass, ownerImage, description, id, estimate) {
            this.logger.log('createMarkup', cardNum, totalCards, name, ownerText,ownerClass, description, id, estimate);

            var theMarkup =
                    '<div class="artifact">' +
                            '<div class="header">' +
                            '<span class="storyID">' + id + '</span>' +
                            '<span class="owner ' + ownerClass + '"><IMG height=40 SRC="' + ownerImage + '"/></span>' +
                            '<span class="ownerText">' + ownerText + '</span>' +
                            '</div>' +
                            '<div class="content">' +
                            '<div class="card-title">' + name + '</div>' +
                            '<div class="description">' + description + '</div>' +
                            '</div>' +
                            '<span class="estimate">' + estimate + '</span>' +
                            '</div>';
    
            if ((cardNum + 1) % 2 === 0) {
                theMarkup = theMarkup + '<div class=pb></div>';
            } else if (cardNum === totalCards - 1) {
                theMarkup = theMarkup + '<div class=cb>&nbsp;</div>';
            }
            this.logger.log(theMarkup);
            return theMarkup;
        },

        getUserImage: function(userRef){
          var imageSize = 20;
            if (userRef){
              if (Ext.isNumber(window.devicePixelRatio)) {
                  imageSize = Ext.util.Format.round(imageSize * window.devicePixelRatio, 0);
              }
              return Rally.environment.getServer().getContextUrl() + '/profile/image/' + Rally.util.Ref.getOidFromRef(userRef) + '/' + imageSize + '.sp';
          } else {
              return Rally.environment.getServer().getImagesPath() + '/cardboard/no-owner.png';
          }
        },
        getStyleSheet: function() {
            this.logger.log('getStyleSheet');
            var styleSheet;
            var docs = Ext.getDoc(); //this.down('#card_box').innerHTML; 
            var elems = docs.query('style');
            for (var i=0; i< elems.length; i++){
                if (elems[i].title == 'printCards'){
                    console.log(elems[i]);
                    styleSheet = elems[i];
                }
            }
            return styleSheet.innerHTML;
        },
    
        savePDF: function() {
            var doc = new jsPDF();
            var html = this.down('#card_box').html;
            this.logger.log('savePDF',html);
            var test = '<a href="http://www.google.com">This doesn\'t work yet</a>';
            doc.fromHTML(test,15,15,{ 'width':170 });
            doc.save('test.pdf');
        },

        printPop: function() {
            var title, options, printWindow, doc, cardMarkup;
    
            title = 'Defects'.slice(0, 1).toUpperCase() + 'Defects'.slice(1);
            options = "toolbar=1,menubar=1,scrollbars=yes,scrolling=yes,resizable=yes,width=1000,height=500";
            printWindow = window.open('', title, options);
            doc = printWindow.document;
            var iterationName = this.iterationDropdown.getRecord().get('Name');
            cardMarkup = this.down('#card_box').html;  
    
            doc.write('<html><head><title>' + iterationName + ' ' + title + '</title>');
            doc.write('<style>');
            doc.write(this.getStyleSheet());
            doc.write('</style>');
            doc.write('</head><body class="landscape">');
            doc.write(cardMarkup);
            doc.write('</body></html>');
            doc.close();
    
            printWindow.print();
            return false;
        }
});