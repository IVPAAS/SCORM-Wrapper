define(["module"],function(module){

    return Event

    function Event(eventName){
        var t = this;
        t.name = eventName
        t.scope = null;
        t.scopeName = null;
        t.listenersCalledCount = 0;
        t.bContinuePropagation = true
        t.onAfterBroadcast = null
        t.removeCurrentListener = null
        t.eventManager = null
        t.eventHandler = null
        t.params = {}
        //
        t.stopPropagation = stopPropagation;
        t.nextPropagation = nextPropagation;
        t.setNextPropagation = setNextPropagation;
        //


        function stopPropagation (){
            t.bContinuePropagation = b;
        }
        function nextPropagation (){
            if( _fnNextPropagation)
                _fnNextPropagation()
        }
        function setNextPropagation (fnNextPropagation){
            _fnNextPropagation = fnNextPropagation;
        }
        function toString (){
            var s
                = "[" +module.uri+ "]"
                + ", [eventName: "+eventName+"]"
                + ", [scopeName: "+t.scopeName+"]"
            return s
        }
    }

})
