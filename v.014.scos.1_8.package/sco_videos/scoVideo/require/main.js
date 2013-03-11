require.config({

        paths:{

            jquery: 'libs/jquery.1.8.3'
            ,text: 'libs/text.2.0.3'
        }
        ,packages: [
            {name:"vs",location:"libs/vs"}
        ]

});
window.console = window.console || {
    log:function(){

    }
}
require([
    "jquery"
    ,"template/templateHandler"
    ,"playerHandler"
    ,"scorm/scormInteraction"
    ,"consoleProxy"
], function(
    $
    ,templateHandler
    ,playerHandler
    ,scormInteraction
    ,consoleProxy
) {

    //
    templateHandler.displayLayout(function(){
        console.log("ontemplateHandler display")
        // playerHandler.embed(callback) is same as saying:
        // playerHandler.eventManager.addListener.readyForInteraction(callback);playerHandler.embed()
        playerHandler.embed(scormInteraction.init)
    })

});
