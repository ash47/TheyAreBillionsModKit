// Generic Dialog
alertify.genericDialog || alertify.dialog('genericDialog',function(){
    return {
        main:function(content){
            this.setContent(content);
        },
        setup:function(){
            return {
                focus:{
                    element:function(){
                        return this.elements.body.querySelector(this.get('selector'));
                    },
                    select:true
                },
                options:{
                    basic:true,
                    maximizable:false,
                    resizable:false,
                    padding:false
                }
            };
        },
        settings:{
            selector:undefined
        }
    };
});

// Map Settings
alertify.mapSettingsDialog || alertify.dialog('mapSettingsDialog', function(){
    return {
        main:function(content){
            this.setContent(content);
        },
        setup:function(){
            return {
                focus:{
                    element:function(){
                        return this.elements.body.querySelector(this.get('selector'));
                    },
                    select:true
                },
                options:{
                    basic:true,
                    maximizable:false,
                    resizable:false,
                    padding:false
                }
            };
        },
        settings:{
            selector:undefined
        }
    };
});

// Entity Settings
alertify.entitySelectionDialog || alertify.dialog('entitySelectionDialog', function(){
    return {
        main:function(content){
            this.setContent(content);
        },
        setup:function(){
            return {
                focus:{
                    element:function(){
                        return this.elements.body.querySelector(this.get('selector'));
                    },
                    select:true
                },
                options:{
                    basic:true,
                    maximizable:false,
                    resizable:false,
                    padding:false
                }
            };
        },
        settings:{
            selector:undefined
        }
    };
});

// XML Editor
alertify.rawXmlDialog || alertify.dialog('rawXmlDialog', function(){
    return {
        main:function(content){
            this.setContent(content);
        },
        setup:function(){
            return {
                focus:{
                    element:function(){
                        return this.elements.body.querySelector(this.get('selector'));
                    },
                    select:true
                },
                options:{
                    basic:true,
                    maximizable:false,
                    resizable:false,
                    padding:false
                }
            };
        },
        settings:{
            selector:undefined
        }
    };
});

// Bonus entities editor
alertify.editBonusEntitiesDialog || alertify.dialog('editBonusEntitiesDialog', function(){
    return {
        main:function(content){
            this.setContent(content);
        },
        setup:function(){
            return {
                focus:{
                    element:function(){
                        return this.elements.body.querySelector(this.get('selector'));
                    },
                    select:true
                },
                options:{
                    basic:true,
                    maximizable:false,
                    resizable:false,
                    padding:false
                }
            };
        },
        settings:{
            selector:undefined
        }
    };
});