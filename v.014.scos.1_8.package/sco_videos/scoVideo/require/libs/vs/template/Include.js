define([
    "jquery"
    ,"text"
    ,"require"
],
function(
    $
    ,text
    ,requireLocal
){

        Include.prototype.getByTemplateID = getByTemplateID;
        Include.prototype.load = load;
        // static functions:
        Include.loadCss = loadCss
        Include.loadCssByPath = loadCssByPath
        Include.getByTemplateFromIncludeID = getByTemplateFromIncludeID
        return Include


        function Include(includeUrl){
            this.includeUrl = includeUrl
            this.strHtml = null;
        }

        /** static function
        *
        * @param {*|jQuery|HTMLElement} $parent
        * @param {String} templateID
        * @param {String} tagName this is optional
        * @return {*|jQuery|HTMLElement}
        */
        function getByTemplateFromIncludeID($parent,templateID,tagName){
           tagName = tagName || "*"
           var ary$ = $($parent.find(tagName + '[templateID="'+templateID+'"]'));
           return (ary$.length != 0)?ary$:null;
        }
        /**
        *
        * @param {String} templateID
        * @param {String} tagName this is optional
        * @return {*|jQuery|HTMLElement}
        */
        function getByTemplateID(templateID,tagName){
           return getByTemplateFromIncludeID($(this.strHtml),templateID)
        }
        /**
         * @param onReady {Function}
         */
        function load(onReady){

            var textLoadCommand = "text!" + this.includeUrl

            if(this.strHtml)
                onReady($(this.strHtml),this)


            require([textLoadCommand],
                function(strHtml){
                    this.strHtml = strHtml
                    onReady($(strHtml),this)
                }
            )
            return this

        }

        function loadCss(url) {
            var link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = url;
            document.getElementsByTagName("head")[0].appendChild(link);
        }
        function loadCssByPath(path) {
            var url = requireLocal.toUrl(path)
            loadCss(url)
        }


    }
)