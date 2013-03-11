//http://knowledge.kaltura.com/javascript-api-kaltura-media-players
// externalInterfaceDisabled must be false
define([
    "jquery"
    ,"vs/event/EventManager"
    ,"assetDataHandler"
    ,"template/templateHandler"
    ,"vs/loadScript"
],
function(
        $
        ,EventManager
        ,assetDataHandler
        ,templateHandler
        ,loadScript
){

        var _kdp
        var _durration
        var _playheadValue
        var _readyForInteraction = false;





        var playerHandler = {
            getPlayer:getPlayer
            ,seek:seek
            ,embed:embed
            ,isReadyForInteraction:isReadyForInteraction
            ,getPercentComplete:getPercentComplete
            ,pause:pause
        }
        var eventManager
            = playerHandler.eventManager
            = new EventManager(playerHandler)
            .createEventHandler("readyForInteraction") // listen to this one before calling jumpto
            .createEventHandler("playerReady")
            .createEventHandler("readyToPlay")
            .createEventHandler("playerStop")
            .createEventHandler("playerEnd")
            .createEventHandler("playerUpdatePlayhead")// event: {playheadValue:N,percentComplete:N,readyForInteraction: B}
            .createEventHandler("mediaReady")


        return playerHandler
        //
        function embed(callback){
            if( callback){
                eventManager.addListener.readyForInteraction(callback);
                // playerHandler.embed(callback) is same as saying:
                // playerHandler.eventManager.addListener.readyForInteraction(callback);playerHandler.embed()
            }

            assetDataHandler.ready(function(){
                var placeHolderID = templateHandler.getPlayerPlaceholderId()
                var url = assetDataHandler.embedUrl();
                var embed = assetDataHandler.embedData();
                embed.targetId = placeHolderID
                $(true,embed,{
                    'flashvars':{
                        'externalInterfaceDisabled' : false,
                        'autoPlay' : false
                    }
                })
                embed.readyCallback = readyCallback;

                console.log("loading: kaltura embed script: " + url)
                $.getScript(url,function(){
                    console.log("kWidget loaded");
                    kWidget.embed(embed);
                })
                function readyCallback ( playerId ){
                    // need timer to break thread from flash, otherwise can't handle errors, so use setTimeout
                    setTimeout(function(){
                        console.log( "kWidget player ready: " + playerId );
                        _kdp= $( '#' + placeHolderID ).get(0);
                        bind2Player()
                    },10)
                }

            })
        }
        function getPercentComplete (){
            if(!_playheadValue || !_durration)
                return 0;
            return Math.round((_playheadValue/_durration) * 100)
        }
        function getPlayer(){
            return _kdp
        }
        function isReadyForInteraction(){
            return _readyForInteraction
        }

        function bind2Player(){


            console.log("bind2Player")

            setListener("kdpReady")
            setListener("doPlay").muteLog()
            setListener("playerReady",onPlayerReady)
            setListener("startUp")
            setListener("readyToPlay",onReadyToPlay) // this crashes
            setListener("doStop",onStop)
            setListener("mediaReady",onMediaReady);
            setListener("durationChange",onDurationChange);
            setListener("playerPlayEnd",onEnd)//.muteLog()
            setListener("playerUpdatePlayhead",onPlayerUpdatePlayhead).muteLog()

            // Credit Zohar Babin for showing workaround here
            eventManager.addListener.readyToPlay(function(e){
                e.removeCurrentListener()
                console.log("onPlayerReady: calling doPlay to compensate for jumpTo bug" )
                eventManager.addListener.playerUpdatePlayhead(function(e2){
                    e2.removeCurrentListener()
                    console.log("onPlayerUpdatePlayhead: FIRST CALL. Ready for seek, setting _readyForInteraction=true, calling eventManager.broadcast.readyForInteraction" )
                    _readyForInteraction = true
                    eventManager.broadcast.readyForInteraction();
                });
                _kdp.sendNotification("doPlay")
            })


        }
        function setListener(listenerName,listener){
            var muteContainer = {
                bMute:false
                ,muteLog :function(){
                    this.bMute = true;
                }
            }
            var globalName = "kdp_listener_"+listenerName;
            window[globalName] = function(){

                var args = arguments
                // need setTimeout to break error handler
                setTimeout(broadcastNow,50)
                function broadcastNow(){
                    if(!muteContainer.bMute)
                        logEvent(listenerName,args)

                    if(listener)
                        listener.apply(playerHandler,args)

                }
            }
            _kdp.addJsListener(listenerName, globalName);

            return muteContainer;
        }
        function logEvent(eventName,args){
            var s = "KDP PLAYER EVENT: "+ eventName
            var i
            var arg
            for(i=0;i<args.length;i++){
                arg = args[i];
                s+= ", ["+i+"]: "
                if(typeof(arg) == "object"){
                    for(var n in arg){
                        s+="["+n+"]:" + arg[n]
                    }
                }
                else{
                   s+=arg
                }
            }
            console.log(s)
        }
        function onEnd(){

            eventManager.broadcast.playerEnd();
        }
        function onStop(){
            eventManager.broadcast.playerStop();
        }
        function onMediaReady(){
            //eventManager.broadcast.mediaReady();
        }
        function onReadyToPlay(){

            eventManager.broadcast.readyToPlay();
        }
        function onPlayerReady(){

            eventManager.broadcast.playerReady();
            //
        }
        function onDurationChange(param) {

            _durration = param.newValue;
            //console.log("onDurationChange XxXXXXXXXXX: _durration: "+_durration)
        }
        function onPlayerUpdatePlayhead(playheadValue){
            _playheadValue = playheadValue
            eventManager.broadcast.playerUpdatePlayhead({
                playheadValue:playheadValue
                ,percentComplete:getPercentComplete()
                ,readyForInteraction: _readyForInteraction
            });
        }
        function pause(){
            _kdp.sendNotification("doPause");
            return playerHandler
        }
        function seek(iTimeSecs){
            if( isNaN(iTimeSecs)){
                throw {message:"playerHandler.js: seek: iTimeSecs isNaN " + iTimeSecs }
                return
            }
            if( !_readyForInteraction){
                throw {message:"playerHandler.js: seek: !_readyForInteraction" }
                return
            }


            console.log("seek: iTimeSecs: " + iTimeSecs)

            //http://html5video.org/kaltura-player/docs/index.php?path=Player_API/SeekApi

            eventManager.addListener.playerUpdatePlayhead(function(e){
                e.removeCurrentListener();
                pause()
            })
            _kdp.sendNotification("doPlay");
            _kdp.sendNotification("doSeek", iTimeSecs);

            return playerHandler
        }



    }
)

