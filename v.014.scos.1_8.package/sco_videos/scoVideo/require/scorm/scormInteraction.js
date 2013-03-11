// https://www.opensesame.com/blog/combining-multiple-scos-one-scorm-course
define([
    "scorm/scormProxy"
    ,"playerHandler"
    ,"template/templateHandler"
],
    function(
        scormProxy
        ,playerHandler
        ,templateHandler
){

        var _msecsMinimumIntervalSave = 10000
        var _thresholdPercentComplete = 90
        var _msecSinceLastPlayheadUpdate
        setListeners()
        var scormInteraction = {
            init:init
        }
        return scormInteraction

        function setListeners(){
            playerHandler.eventManager
                .addListener.playerReady(function(){
                    console.log("playerReady")
                })
                .addListener.readyToPlay(function(){
                    console.log("readyToPlay")
                })
                .addListener.playerEnd(function(){
                    console.log("playerEnd");
                    templateHandler.showPanelNextSco()
                    scormProxy.exit()

                })
                .addListener.playerUpdatePlayhead(function(e){

                    var playheadValue = e.params.playheadValue
                    var percentComplete = e.params.percentComplete
                    var trc = "playerUpdatePlayhead: "+ playheadValue + ", percentComplete: "+ percentComplete

                    if( !playerHandler.isReadyForInteraction() ){
                        // this is called once before can call jumpTo
                        trc += ", playerUpdatePlayhead, not ready for interaction";
                        console.log(trc)
                        return;
                    }

                    var msecNow = new Date().getTime();
                    var msecDelta = msecNow - _msecSinceLastPlayheadUpdate
                    var bSaving = false

                    trc += ", msecDelta: "+ msecDelta
                    trc += ", Min Save Interval: "+ _msecsMinimumIntervalSave
                    if(!_msecSinceLastPlayheadUpdate || msecDelta > _msecsMinimumIntervalSave){
                        bSaving = true
                        scormProxy.savePlayheadPosition(playheadValue)
                        trc += ", saving: 1"
                        _msecSinceLastPlayheadUpdate = msecNow
                    }
                    else{
                        trc += ", saving: 0"
                    }
                    var bSetComplete = 0

                    trc += ", _thresholdPercentComplete: "+ _thresholdPercentComplete
                    if(percentComplete > _thresholdPercentComplete && !scormProxy.hasBeenSetComplete()){
                        bSaving = true;
                        bSetComplete = 1
                        trc += ", bSetComplete: "+ bSetComplete
                    }
                    if(bSaving)
                        console.log(trc)
                    if(bSetComplete)
                        setComplete()


                })
        }

        function setComplete(){
            templateHandler.showModuleCompletedYes()
            scormProxy.setComplete()
        }

        function init(){
            console.log("calling scormProxy.init()");
            //
            var bFoundScorm = scormProxy.init();
            if(bFoundScorm){
                templateHandler.showFoundSCORM()
            }
            else{
                templateHandler.showDidNotFindSCORM()
            }
            //

            if(scormProxy.statusIsComplete()){
                console.log("displaying complete")
                templateHandler.showModuleCompletedYes()
            }
            else{
                console.log("displaying incomplete")
                templateHandler.showModuleCompletedNo()
            }


            handleLastPlayHeadPosition()

            return true
        }

        function handleLastPlayHeadPosition(){
            var trc = "handleLastPlayHeadPosition"
            var lastPosition;
            if(scormProxy.connectedToScormApi()){
                lastPosition = scormProxy.getLastPlayheadPosition()
                trc+= ": SCORM found, lastPosition."
            }
            else{
                lastPosition = "30"
                trc+= ": SCORM NOT found, hard coding lastPosition for demo."
            }

            lastPosition = parseFloat(lastPosition);

            trc+= ", lastPosition: " + lastPosition
            console.log(trc)


            playerHandler.seek(lastPosition)

        }



})