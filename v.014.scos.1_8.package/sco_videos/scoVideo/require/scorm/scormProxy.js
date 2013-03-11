// https://www.opensesame.com/blog/combining-multiple-scos-one-scorm-course
define([
    "scorm/findScorm"
],
    function(
        findScorm
){

        // this is for SCORM 1.2, not 2004 or 1.3
        var _api = findScorm.getApi()
        var _setComplete
        var _status
        var scormProxy = {
            init:init
            ,getLastPlayheadPosition:getLastPlayheadPosition
            ,savePlayheadPosition:savePlayheadPosition
            ,exit:exit
            ,setComplete:setComplete
            ,connectedToScormApi:connectedToScormApi
            ,hasBeenSetComplete:hasBeenSetComplete
            ,statusIsComplete:statusIsComplete
        }

        return scormProxy
        function connectedToScormApi(){
            return (_api != null)
        }
        function init(){
            if(!_api){
                console.log("init: can't find api")
                return false
            }
            var r = _api.LMSInitialize("");
            console.log("found api. LMSInitialize: "+ r)

            if(r === "false"){
                var errorString = _api.LMSGetLastError("");
                 errorString += ": GetDiagnostic(): "+ _api.GetDiagnostic("");
                console.log("error initializing: "+ errorString)
                return false
            }

            _status = _api.LMSGetValue("cmi.core.lesson_status");

            console.log("cmi.core.lesson_status: was: "+ _status)
            if(_status != "completed" && _status != "passed"){

               r = _api.LMSSetValue("cmi.core.lesson_status", "incomplete");
               console.log("setting to incomplete "+r)
            }
            return true
        }
        function statusIsComplete(){
            if(_setComplete)
                return true
            return (_status == "completed")

        }
        function hasBeenSetComplete(){
            return _setComplete;
        }
        function getLastPlayheadPosition(){
            if(!_api){
                console.log("getLastPlayheadPosition: can't find api")
                return 0
            }

            var p = _api.LMSGetValue("cmi.core.lesson_location");
            p = parseFloat(p);

            if( String(p) == "NaN"){
                console.log("getLastPlayheadPosition: hard writing to 0 ")
                p = 0

            }else{

                console.log("getLastPlayheadPosition: found: "+ p)
            }



            return p

        }
        function savePlayheadPosition(p){
            if(!_api){
                console.log("savePlayheadPosition: can't find api: p: "+ p)
                return 0
            }
            p = parseFloat(p);
            if( String(p) == "NaN" ){
                console.log("savePlayheadPosition: hard writing to 0 ")
                p = 0
            }
            p = String(p)

            var r = _api.LMSSetValue("cmi.core.lesson_location",p);
            var r2 = _api.LMSCommit("")

            if(r === "false" || r2 ==="false"){
                var errorString = _api.LMSGetLastError("");
                console.log("error initializing: "+ errorString)
                return false
            }

            console.log("savePlayheadPosition ("+p+"): r: "+ r +", r2: "+ r2)

            return r
        }
        function setComplete(){
            if(_setComplete)
                return
            _status == "completed"
            _setComplete = true
            if(!_api){
                console.log("setComplete: can't find api")
                return 0
            }
            var r1 = _api.LMSSetValue("cmi.core.lesson_status", "completed");
            var r2 = _api.LMSSetValue("cmi.core.score.raw,", "100");
            var r3 = _api.LMSCommit("")

            console.log("setComplete: r: "+ r1 +", r2: "+ r2+", r3: "+ r3)
            return r1

        }
        function exit(){
            if(!_api){
                console.log("exit: can't find api")
                return 0
            }

            var trc = "exit: "


            //var r1 = logoutOrSupend()
            var r1 = _api.LMSSetValue("cmi.core.exit", "suspend");
            trc += ", r1: "+ r1
            var r2 = _api.LMSCommit("")
            trc += ", r2: "+ r2
            var r3 = _api.LMSFinish("")
            trc += ", r3: "+ r3

            console.log(trc)
            return r3

            function logoutOrSupend(){
                var r
                //http://pipwerks.com/2008/05/10/cmicoreexit-cmiexit/
                if(_setComplete){
                    r = _api.LMSSetValue("cmi.core.exit", "logout");
                } else {
                    r = _api.LMSSetValue("cmi.core.exit", "suspend");
                }
                return r
            }


        }




    }
)