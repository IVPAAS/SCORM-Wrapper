define([
    "jquery"
    ,"vs/template/Include"
    ,"require"
    ,"assetDataHandler"

],
function(
    $
    ,Include
    ,requreLocal
    ,assetDataHandler
){
        var _$panelNextSco
        var _$include
        var _$moduleCompleted
        var _$moduleCompleted_yes
        var _$moduleCompleted_no
        var _$foundSCORM
        var _$foundSCORM_yes
        var _$foundSCORM_no
        var templateHandler = {
            displayLayout:displayLayout
            ,getPlayerPlaceholderId:getPlayerPlaceholderId
            ,showPanelNextSco:showPanelNextSco
            ,showPanelNextSco:showPanelNextSco
            ,showModuleCompletedYes:showModuleCompletedYes
            ,showModuleCompletedNo:showModuleCompletedNo
            ,showFoundSCORM:showFoundSCORM
            ,showDidNotFindSCORM:showDidNotFindSCORM
        }

        return templateHandler

        function displayLayout(onReady){
            Include.loadCssByPath("template/template.css")
            new Include("template/include001.htm").load(function($include,include){
                _$include = $include
                $("#div1").remove()
                $("body").append($include)
                _$panelNextSco = $("#panelNextSco").remove()
                //
                _$moduleCompleted_yes = $("#moduleCompletedYes").remove()
                _$moduleCompleted_no = $("#moduleCompletedNo").remove()
                _$moduleCompleted = $("#moduleCompleted").remove()
                //
                _$foundSCORM_yes = $("#foundScormYes").remove()
                _$foundSCORM_no = $("#foundScormNo").remove()
                _$foundSCORM = $("#foundScorm").remove()

                //
                assetDataHandler.ready(function(){
                    $("#title1").html(assetDataHandler.getTitle())
                    onReady()
                })
            })
        }
        function showModuleCompletedYes(){
            _$moduleCompleted.appendTo("#header").append(_$moduleCompleted_yes)
            _$moduleCompleted_no.remove()
        }
        function showModuleCompletedNo(){
            _$moduleCompleted.appendTo("#header").append(_$moduleCompleted_no)
            _$moduleCompleted_yes.remove()
        }
        function showPanelNextSco(){
            _$include.append(_$panelNextSco)
            $("#btnClosePanelNextSco").click(function(){
                _$panelNextSco.remove()
            })
        }
        function getPlayerPlaceholderId(){ // has to be all caps
            return "PLAYERPLACEHOLDER"
        }
        function showFoundSCORM(){
            _$foundSCORM.appendTo("#footer").append(_$foundSCORM_yes)
            _$foundSCORM_no.remove()
        }
        function showDidNotFindSCORM(){
            _$foundSCORM.appendTo("#footer").append(_$foundSCORM_no)
            _$foundSCORM_yes.remove()
        }




    }
)