//currentDirectoryHandler.js
define(["jquery"],
    function($){

        var _rootFolderName = "site"//"drkennethsilvestri.com"
        var _rootUrl
        var _currentDirectoryUrl
        var _currentDirectoryName

        return {
                loadScript : loadScript
            ,	loadCss : loadCss
            ,	getSiteRootUrl : getSiteRootUrl
            ,	loadInclude : loadInclude
            ,	getCurrentDirectoryName : getCurrentDirectoryName
            ,	getCurrentDirectoryUrl : getCurrentDirectoryUrl
            ,	setRootFolderName : setRootFolderName

        }
        function requireConfigPackagesRelative2Local(packages){
            //packages :[{name:"name",location:"location",main:"main",}]
            var currentDir = getCurrentDirectoryUrl()
            $.each(packages,function(i,package){
                var loc = package.location
                package.location = currentDir + "/" + loc;
            })

            require.config({
                packages: packages
            });
        }
        function requireConfigPathsRelative2Local(paths){
            //paths :{"name":"url"}
            var currentDir = getCurrentDirectoryUrl()
            var path;
            for( var n in paths){
                path = paths[n];
                paths[n] = currentDir + "/" + path;
            }
            require.config({
                paths: paths
            });
        }
        function setRootFolderName(strName){
            _rootFolderName = strName
        }
        function loadScript(url,onLoad){
            url = checkUrlForRootReference(url)
            // use this for better debugging then $.getScript
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src =  url
            script.onreadystatechange= function () {//This is for IE
                if (this.readyState == 'complete' || this.readyState == "loaded"){
                    loaded()
                };
            }
            script.onload= function(){ //This is for Non-IE
                loaded()
            };
            document.getElementsByTagName('head')[0].appendChild(script);
            var _loaded = false
            function loaded(){
                if( _loaded )
                    return;
                _loaded = true
                if( onLoad )
                    onLoad()
            }
        }
        function loadCss(url){
            //http://www.phpied.com/when-is-a-stylesheet-really-loaded/
            url = checkUrlForRootReference(url)
            $("head").append("<link>");
            var $css = $("head").children(":last");
            $css.attr({
                rel:  "stylesheet",
                type: "text/css",
                href: url
            });
            return $css
        }
        function checkUrlForRootReference(url){
            if( url.indexOf("/") == 0 && url.indexOf("//") != 0 ){
                url = getSiteRootUrl() + url
            }
            return url
        }
        function loadInclude(url,onReady){
            //http://www.phpied.com/when-is-a-stylesheet-really-loaded/
            url = checkUrlForRootReference(url)
            $.get(url,function(strHTML){
                onReady($(strHTML))
            })
        }
        function getSiteRootUrl(){
            if( _rootUrl )
                return _rootUrl
            var url = document.location.toString();
            var iRoot = url.lastIndexOf(_rootFolderName);
            _rootUrl= url.substring(0,iRoot) + _rootFolderName
            return _rootUrl
        }
        function getCurrentDirectoryUrl(){
            if( _currentDirectoryUrl )
                return _currentDirectoryUrl
            var url = document.location.toString();
            if( url.indexOf("?") != -1)
                url = url.substring(0,url.indexOf("?"))

            if( url.indexOf("#") != -1)
                url = url.substring(0,url.indexOf("#"))

            url = url.substring(0,url.lastIndexOf("/"))

            _currentDirectoryUrl =  url

            return _currentDirectoryUrl;

        }
        function getCurrentDirectoryName(){
            if( _currentDirectoryName )
                return _currentDirectoryName
            var url = document.location.toString();
            if( url.indexOf("?") != -1)
                url = url.substring(0,url.indexOf("?"))

            if( url.indexOf("#") != -1)
                url = url.substring(0,url.indexOf("#"))

            var name = url.substring(getSiteRootUrl().length + 1)
            if( name.indexOf("/") == -1)
                name = ""
            else
                name = name.substring(0,name.indexOf("/"))


            _currentDirectoryName = name

            return _currentDirectoryName;

        }


})