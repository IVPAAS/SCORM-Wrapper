define(
    function(){

        loadScript.loadCss = loadCss

        return loadScript

        function loadScript(url,onLoad){
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

            $("head").append("<link>");
            var $css = $("head").children(":last");
            $css.attr({
                rel:  "stylesheet",
                type: "text/css",
                href: url
            });
            return $css
        }

    }
)