define(["vs/event/Event"],
    function(Event){

    return EventHandler

    function EventHandler(eventName,manager){
        var t = this;
        t.addListener = addListener;
        t.prependListener = prependListener;
        t.removeListener = removeListener;
        t.broadcast = broadcast;
        t.listners = []
        //


        function addListener(listner){
            t.listners.push(listner)
            return manager
        }
        function prependListener(listner){
            t.listners.unshift(listner);
            return manager
        }
        function removeListener(listnerToRemove){
            var i = 0;
            var newAry = []
            var listner
            for(i=0;i<t.listners.length;i++){
                listner = t.listners[i]
                if( listnerToRemove != listner){
                    newAry.push(listner)
                }
                else{
                    //debugger
                }

            }
            t.listners = newAry

            return manager;
        }
        function broadcast(paramObj){
            var event
            if( paramObj && paramObj.event){
                event = paramObj.event
            }
            else{
                event = new Event(eventName)
            }
            if( paramObj){
                var n
                for(n in paramObj){
                    if( n!= event)
                        event.params[n] = paramObj[n]
                }
            }
            event.scope = event.scope || manager.scope
            event.scopeName = event.scopeName || manager.scopeName
            event.eventManager = manager
            event.eventHandler = t

            var cloneListeners = t.listners.slice(0);
            var count = 0;
            event.setNextPropagation(function(){
                callIteration(count)
            })
            callIteration(0)
            return event;
            function callIteration(i){
                if(i >=  cloneListeners.length){

                    if(event.onAfterBroadcast)
                        event.onAfterBroadcast()

                    return;
                }
                count ++
                var listener = cloneListeners[i];
                event.listenersCalledCount = count
                event.removeCurrentListener = function(){

                    return removeListener(listener)
                }
                listener(event)
                if(event.bContinuePropagation )
                    callIteration(i+1)

            }
        }

    }

})
