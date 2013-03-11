define([
    "jquery"
    ,"vs/event/EventManager"
],
    function(
        $
        ,EventManager
        ){

        var _url = "scoVideo/sco_video_asset_data.json"

        var _rawData
        var _scoID
        var _scoData
        var _loading

        var assetDataHandler = {
            getScoId:getScoId
            ,getTitle:getTitle
            ,ready:ready
            ,embedData:embedData
            ,embedUrl:embedUrl
            ,partnerID:partnerID
            ,uiconf_id:uiconf_id
            ,entryId:entryId
        }

        var eventManager = new EventManager(assetDataHandler).createEventHandler("ready")
        return assetDataHandler



        function partnerID(){
            var wid = _scoData.embed.wid
            var iUnderscore = wid.indexOf("_");
            id = wid.substring(iUnderscore+1)
            return id
        }
        function uiconf_id(){
            return _scoData.embed.uiconf_id
        }
        function uiConfId(){
            return getValueFromEmbed("uiConfId");
        }
        function entryId(){
            return getValueFromEmbed("entryId");
        }
        function ready(callback){
            if(_rawData ){
                callback(assetDataHandler)
                return
            }
            eventManager.addListener.ready(callback)
            if(_loading)
                return
            _loading = 1
            console.log("loading")
            $.getJSON(_url,function(data){
                console.log("metadata loaded")
                parseData(data)
                eventManager.broadcast.ready();
                _loading = 0
            })
        }
        function getTitle(){
            return _scoData.title
        }
        function embedUrl(){

            var u = _scoData.url || _rawData.templateUrl

            u = u.replace(/{partnerId}/g, partnerID());
            u = u.replace(/{uiConfId}/g, uiconf_id());
            var l = document.location.toString();
            // older browsers MAY not like the "//" so add you must add protocal
            // need to prevent security warnings
            // plus unless KMC specifies secure, the http may not be available.
            if(l.indexOf("https") == 0 && !getForceNoHttps())
                u = "https" + u;
            else
                u = "http" + u;

            return u
        };
        function getForceNoHttps(){
            var b = _scoData.forceNoHttps;
            if( b == null){
                b = _rawData.forceNoHttps;
            }
            if( b == null)
                return false
            return b
        }
        function getScoId(){
            if( _scoID)
                return _scoID

            var str = window.document.location.toString();

            str = str.replace(/\\/g, '/');

            var iStart = str.lastIndexOf("/") + 1
            var iEnd = str.lastIndexOf(".html")
            str = str.substring(iStart,iEnd)

            _scoID = str;
            return _scoID;

        }
        //
        function embedData(){
            return _scoData.embed
        }
        function parseData(rawData){
            _rawData = rawData
            _scoData = (function(){
                var i,sco, ary = rawData.scos;
                for (i=0;i<ary.length;i++){
                    sco = ary[i]
                    if(sco.id == getScoId()){
                        return sco;
                    }
                }
            })();
            if(_scoData == null){
                var msg = "can't find sco data for id: "+ getScoId()
                alert(msg)
                throw msg
            }
            var templateEmbed = rawData.templateEmbed
            var embed = _scoData.embed;
            delete templateEmbed.entry_id
            $.extend(true,embed,templateEmbed)
            //var u = embedUrl()
            //debugger
        }




    }
)