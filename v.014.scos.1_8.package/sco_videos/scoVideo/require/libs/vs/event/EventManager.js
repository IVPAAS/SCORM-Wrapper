define(["vs/event/EventHandler"],
    function(EventHandler){
        //EventManager.js

        return EventManager

        function EventManager(scope){

            var t = this;
            t.setScopeName = setScopeName;
            t.setScope = setScope;
            t.createEventHandler = createEventHandler;
            t.scope = scope;
            t.scope = scope;
            t.eventHandlers = {}
            t.addListener = {}
            t.prependListener = {}
            t.removeListener = {}
            t.broadcast = {}
            //

            //
            var _scopeName
            //
            function setScopeName(name){
                _scopeName = name;
                return t;
            }
            function setScope(s){
                t.scope = s;
                return t;
            }
            function createEventHandler(eventName){
                var handler = new EventHandler(eventName,t);
                t.eventHandlers[eventName] = handler;
                //
                t.addListener[eventName]  =  handler.addListener
                t.prependListener[eventName]  =  handler.prependListener
                t.removeListener[eventName]  = handler.removeListener
                t.broadcast[eventName]  = handler.broadcast
                //
                return t;
            }



        }


})