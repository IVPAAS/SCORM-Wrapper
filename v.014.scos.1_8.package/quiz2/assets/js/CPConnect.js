cp.AICCLoadVars = function(_escapeAICCvs_bln, _ignoreEscapeList_str)
{
	// For enumeration of properties, they must be dynamic
   // var command;
   // var version;
   // var session_id;
   // var aicc_data;
   // var tracking;
   // var m_escapeAICCvs_bln:Boolean;
   // var m_ignoreEscapeList_str = "";


	// Constructor Function
	this.m_escapeAICCvs_bln = _escapeAICCvs_bln;
	this.m_ignoreEscapeList_str = _ignoreEscapeList_str;
}


    // ******************************************************************
    // *
    // *     Method:           serverPost.toString
    // *     Description:      Overrides the default toString of LoadVars
    // *                       function, so that it does't URL-encode the
    // *                       "name".
    // *     Returns:
    // *
    // ******************************************************************
cp.AICCLoadVars.prototype =    
{
	toString:function ()
    {
        var result_str = [];
        for (var x in this)
        {
            if (x != "onLoad" && x!= "toString" && x!= "parent" && x != "tracking" && x != "m_escapeAICCvs_bln" && x != "m_ignoreEscapeList_str")
            {
				if(!(this.m_escapeAICCvs_bln) && (x == "version" || x == "session_id"))
				{
					result_str.push(x + "=" + this[x]);
				} 
				else 
				{
					if((this.m_ignoreEscapeList_str) != "")
					{
						// do something;
						var temp_str = "";
						// Loop through the entire string, one character at a time
						for(var temp_int = 1; temp_int < this[x].length + 1; temp_int++)
						{
							// Grab each character
							var tempChar_str = this[x].substring(temp_int-1, temp_int);
							// If the character is in the list to ignore - we won't escape it
							if(this.m_ignoreEscapeList_str.indexOf(tempChar_str) > -1)
							{
								temp_str += tempChar_str;
							} else {
								temp_str += escape(tempChar_str);
							}
						}
						result_str.push(x + "=" + temp_str);
					} else {
		                result_str.push(x + "=" + encodeURIComponent(this[x]));
					}
				}
            }
        }

        return result_str.join('&');
    }

}

cp.AICC = function(_adapterObject, launchURL, escapeURLvs_bln, ignoreEscape_str, sendLessonData_bln)
{
	cp.AICC.baseConstructor.call(this);
	//*********************************************
	// Private Props
	// Global Properties
	this.m_contentURL_str;

	// AICC-specific properties
	this.m_version;
	this.m_aicc_url;
	this.m_aicc_sid;
	this.m_aicc_data;

	//*********************************************
	// Public Props

	// Configurable Properties
	this.overrideQueueTimeoutInterval_int = 10;	// Number of seconds to set queue timeout for commands POSTED to LMS.
	this.KeepSessionAliveInterval_int = 0				// Number of seconds to send a GetParam request to LMS
	this.KeepSessionAliveTimeoutInterval_int = 0		// Number of seconds to keep session alive

	// Global Objects - are these public?
	this.m_serverPost;
	this.m_serverResult;
	this.m_serverTemp;
	this.m_serverUtilities;
	this.m_LMS = new Object();
	this.m_return_str = "\r\n";         			// String; Contains the AICC-required format for return strings (Carriage Return + Line Feed)
	this.m_serverBusy_bln = false;					// Boolean; Only used to determine is getTrackingData has been called (for now)
	this.KeepSessionAlive_obj = new Object();
	this.KeepSessionAliveTimer_int = 0;			// Integer; Number of minutes since session activity
	this.KeepSessionAliveInterval_var = "";				// SetInterval variable
	this.m_adapterObjectRef;	// Used to get root and stage
	
	
	//*********************************************
	// Constructor Function
	if (escapeURLvs_bln != undefined)
	{
		this.SetEscapeAICCvs(escapeURLvs_bln);
	}
	if (ignoreEscape_str != undefined)
	{
		this.SetIgnoreEscapeList(ignoreEscape_str);
	}
	if (sendLessonData_bln != undefined)
	{
		this.SetLessonDataTracked(sendLessonData_bln);
	}
	if(_adapterObject != undefined)
	{
		this.m_adapterObjectRef = _adapterObject;
		//this.SetObjectReference(_adapterObject);
	}
	// Declare vars above and initialize them here...

	// Mark development version
	this.m_version = "3.5"
	//version = "2.0";
	// Initialize Global Objects
	this.m_serverPost   = new cp.AICCLoadVars(this.IsAICCvsEscaped(), this.GetIgnoreEscapeList());
	this.m_serverResult = new cp.AICCLoadVars(this.IsAICCvsEscaped(), this.GetIgnoreEscapeList());
	this.m_serverResult.parent = this;
	this.m_serverUtilities = new cp.Utilities(_adapterObject);
	
	this.m_serverTemp   = new cp.AICCLoadVars(this.IsAICCvsEscaped(), this.GetIgnoreEscapeList());


	// Check to see if the constructor was passed the AICC SID and AICC URL parameters
	if(launchURL != undefined)
	{
		this.SetURL(launchURL);
	}

	//Presenter bug 153644
	// Start the global "timer" to track how long the user has been in this file.
	//resetTimer();

	//startDev();
}

cp.inherits(cp.AICC, cp.TrackingAdapter);

    //*********************************************
    // AICC-specific functions (Get)

cp.AICC.prototype.GetAICCversion = function() {return this.m_version;}

cp.AICC.prototype.GetAICCurl = function()
{
	if (this.m_aicc_url == "" || this.m_aicc_url == undefined) 
	{
		this.SetAICCurl(this.m_serverUtilities.getParameter("aicc_url", this.m_contentURL_str));
	}
	return this.m_aicc_url;
}

cp.AICC.prototype.GetAICCsid = function()
{
	if (this.m_aicc_sid == "" || this.m_aicc_sid == undefined) {
		//SetAICCsid(GetURLparameter("aicc_sid"));
		this.SetAICCsid(this.m_serverUtilities.getParameter("aicc_sid", this.m_contentURL_str));
	}
	return this.m_aicc_sid;
}


cp.AICC.prototype.GetURL = function()
{
	return this.m_contentURL_str;
}


	//*********************************************
	// AICC-specific functions (Set)

cp.AICC.prototype.FixAICCurl = function(value_str)
{
	if (value_str.toUpperCase().substr(0, 4) != "HTTP")
	{
		if (this.m_contentURL_str.toUpperCase().substr(0,5) == "HTTPS")
		{
			value_str = this.m_contentURL_str.substr(0,5) + "://" + value_str;
		} 
		else 
		{
			if (this.m_contentURL_str.toUpperCase().substr(0,4) == "HTTP")
			{
				value_str = this.m_contentURL_str.substr(0,4) + "://" + value_str;
			} 
			else 
			{
				value_str = "http://" + value_str
			}
		}
	}
	return value_str;
}

cp.AICC.prototype.SetAICCversion = function(value_str)
{
	this.m_version = value_str;
}
cp.AICC.prototype.SetAICCurl = function(value_str)
{
	value_str = unescape(value_str);
	if (value_str != "" && value_str != undefined)
	{
		this.m_aicc_url = this.FixAICCurl(value_str);
	} 
	else 
	{
		this.m_aicc_url = value_str;
	}
}
cp.AICC.prototype.SetAICCsid = function(value_str)
{
	this.m_aicc_sid = unescape(value_str);
}



	// Global functions
	// *************************************************************************
	// *                                                                       *
	// *     Method:           SetURL                                          *
	// *     Description:      Intended to set the URL of the current file     *
	// *                       because this file may be loaded via a loadMovie *
	// *					   and not receive the parameters that are 		   *
	// *				 	   required for AICC communication.				   *
	// *     Returns:                                                          *
	// *                                                                       *
	// *************************************************************************
cp.AICC.prototype.SetURL = function(URL_str)
{
	// the next line is removed explicitly for SABA, since it includes characters that breaks the getParameter function.  We'll escape each parameter that is returned by the getParameter function.
	//URL_str = unescape(URL_str);

	// Set contentURL - so that we can compare that to the URL of the AICC_URL field
	if(this.m_contentURL_str == undefined || this.m_contentURL_str == "")
	{
		this.m_contentURL_str = window.location.toString();
	}

	this.SetAICCurl(unescape(this.m_serverUtilities.getParameter("aicc_url", this.m_contentURL_str)));
	this.SetAICCsid(unescape(this.m_serverUtilities.getParameter("aicc_sid", this.m_contentURL_str)));	
}

	// *************************************************************************
	// *                                                                       *
	// *     Method:          Initialize                                       *
	// *     Description:                                                      *
	// *     Returns:         Boolean                                          *
	// *              OVERRIDDEN                                                         *
	// *************************************************************************
cp.AICC.prototype.Initialize = function()
{
	if(this.IsInitialized())
	{
		// do nothing - already initialized;
	} 
	else 
	{	
		// Return true or false, based on whether aicc_url and aicc_sid parameters exist
		if(this.GetAICCurl() == "" && this.GetAICCsid() == "")
		{
			this.SetURL(document.referrer);//(temp_obj.loaderInfo.loaderURL);
			this.SetInitialized(true);			
		} 
		else 
		{
			this.SetInitialized(true);
		}		
	}
	return this.IsInitialized();
}

cp.AICC.prototype.AICCbuild = function(command, AICCdata)
{
	var temp_obj = new cp.AICCLoadVars(this.IsAICCvsEscaped(), this.GetIgnoreEscapeList());
	temp_obj.params = {};
	temp_obj.params['aicc_data'] = AICCdata;
	temp_obj.params['session_id'] = this.GetAICCsid();
	temp_obj.params['version'] = this.GetAICCversion();
	temp_obj.params['command'] = command;
	
	this.AddToQueue(temp_obj);
}

cp.AICC.prototype.ProcessLMSCalls = function(parameter_obj)
{	
	// The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    if (this.IsInitialized() || (parameter_obj.params['command'] && parameter_obj.params['command'].toUpperCase() == "GETPARAM" && this.GetAICCurl() != ""))
	{
		if(parameter_obj.params['command'].toUpperCase() == "EXITAU")
		{
			// This isn't always caught (especially when using external tracking mechanism), so we'll add it here for now
			this.SetInitialized(false);
		}
		var serverNew = new cp.AICCLoadVars(this.IsAICCvsEscaped(), this.GetIgnoreEscapeList());
		serverNew = parameter_obj;
		
		var params = serverNew.params;
			
		this.m_serverResult.command = params['command'];
		var lAICCData = params['aicc_data'];
		if(this.m_serverResult.command.toUpperCase() == "PUTINTERACTIONS")
		{
			lAICCData = URLEncode(lAICCData,true);
		}
		
		var objXMLHTTP = new XMLHttpRequest();
		
		objXMLHTTP.open ("POST", this.GetAICCurl(), false);	
		objXMLHTTP.setRequestHeader ("Content-Type", "application/x-www-form-urlencoded");
		var strPostData = "session_id=" + URLEncode(params['session_id']);
		//cp.log("AICC Data : " + params['aicc_data']);
		strPostData += "&version=" + this.m_version;
		strPostData += "&command=" + URLEncode(params['command']) +
					   "&aicc_data=" + lAICCData;
		this.m_serverBusy_bln = true;
		objXMLHTTP.send (strPostData);
		var strReturn = objXMLHTTP.responseText;			
		this.ProcessLMSResult(strReturn);
	} 
	else 
	{	
		// Don't post - LMS is not initialized		
	}
}

cp.AICC.prototype.ProcessLMSResult = function (iRetStr) {
    var temp_command_str = this.m_serverResult.command;
    var temp_obj = new cp.AICCLoadVars(this.IsAICCvsEscaped(), this.GetIgnoreEscapeList());
    if (temp_command_str.toUpperCase() == "GETPARAM") {
        this.m_LMS = this.ParseTrackingData(iRetStr);
        if (this.m_LMS && this.m_LMS.Core_lesson && this.m_LMS.Core_lesson.blob) {
            resumeDataChunk = unescape(this.m_LMS.Core_lesson.blob.toString());
            resumeDataChunk = trimStartingAndTrailingSpaces(resumeDataChunk);
        }
        if ((resumeDataChunk != "") && (resumeDataChunk != undefined) && resumeDataChunk != "0") {
            cp.log(resumeDataChunk);
            var lPlaybackController = cp.movie.playbackController;
            if (lPlaybackController)
                lPlaybackController.RestoreQuizState();
        }
        var LMSLastError = new Object();
        LMSLastError.Errors = this.m_LMS.Errors;
        //this.parent.SetInitialized(this.parent.LMS.Errors.error == 0);
        // should set the next line back to: this.parent.setTrackingDataLoaded(this.parent.LMS.Errors.error == 0);
        this.SetTrackingDataLoaded(true);
    } else {
        if (temp_command_str.toUpperCase() == "EXITAU") {
            if (LMSLastError.hasOwnProperty("Errors") && LMSLastError.Errors.error == 0) {
                this.SetInitialized(false);
            }
        }
    }
    this.m_serverBusy_bln = false;
}

cp.AICC.prototype.ClearPendingCalls = function()
{
	if(!this.AICCQueue || this.AICCQueue.length <= 0)
		return;
	
	this.AICCLMSCallTimer = undefined;
	clearInterval(this.AICCLMSCallTimer);
	var lPendingCalls = this.AICCQueue.length;
	for(var i = 0; i < lPendingCalls; ++i)
	{
		var lFunctionObj = this.AICCQueue.shift();
		this.ProcessLMSCalls(lFunctionObj);
	}
}

cp.AICC.prototype.AddToQueue = function(temp_obj)
{
	if(!this.AICCQueue)
		this.AICCQueue = new Array();
	
	this.AICCQueue.push(temp_obj);
	
	var self = this;
	this.AICCLMSCallTimer;	
	if(!this.AICCLMSCallTimer)
	{
		this.AICCLMSCallTimer = setInterval(function()
										{
											if(self.AICCQueue.length <= 0)
											{
												clearInterval(self.AICCLMSCallTimer);
												self.AICCLMSCallTimer = undefined;
												return;
											}											
											var lFunctionObj = self.AICCQueue.shift();
											self.ProcessLMSCalls(lFunctionObj);
										},100);
	}	
}

//OVERRIDDEN
cp.AICC.prototype.Finish = function()
{
	this.SendExitData();
}

cp.AICC.prototype.CheckInteractionResponse = function(response_str)
{
	if(typeof response_str !== 'string')
		return response_str;
	var result_str = "";
	var encapsulate_bln = false;
	for(var char_int=0;char_int<response_str.length;char_int++)
	{
		if(response_str.substr(char_int,1) == ",")
		{
			if(response_str.substr(char_int - 1,1) != "\\")
			{
				encapsulate_bln = true;
			}
		}
	}
	if (encapsulate_bln)
	{
		result_str = "{" + escapeJS(response_str) + "}"
	} 
	else 
	{
		result_str = escapeJS(response_str);
	}
	return result_str;
}
//OVERRIDDEN
cp.AICC.prototype.SetInteractionData = function(interactionID_str, objectiveID_str, type_str, correctResponse_str, studentResponse_str, result_str, weight_int, latency_str, date_str, time_str, descriptionForInteraction)
{
	if(!this.m_interaction_ary)
		this.m_interaction_ary = [];
	var temp_int = this.m_interaction_ary.length;
	this.m_interaction_ary[temp_int] = new Array();
	this.m_interaction_ary[temp_int]["interactionID_str"] = interactionID_str;
	this.m_interaction_ary[temp_int]["objectiveID_str"] = objectiveID_str;
	this.m_interaction_ary[temp_int]["type_str"] = type_str;
	this.m_interaction_ary[temp_int]["correctResponse_str"] = this.CheckInteractionResponse(correctResponse_str);
	this.m_interaction_ary[temp_int]["studentResponse_str"] = this.CheckInteractionResponse(studentResponse_str);
	this.m_interaction_ary[temp_int]["result_str"] = result_str;
	this.m_interaction_ary[temp_int]["weight_int"] = weight_int;
	
	//trace("Tracking Adapter setting interaction data");
	/***GS#161069, Latency time should be in format HH:MM:SS***/
	if(latency_str == undefined || latency_str == "" || latency_str == "0")
	{
		latency_str = this.FormatTime(0);
	} 
	else if(typeof(latency_str) == "number") 
	{
		latency_str == this.FormatTime(latency_str);
	}
	this.m_interaction_ary[temp_int]["latency_str"] = latency_str;
	//trace("11111AICC Tracking Adapter setting interaction data date_str = " + date_str);
	if(date_str == undefined || date_str == "")
	{
		//date_str = date()
		/***GS#161069, Date for AICC should be in format YYYY/MM/DD***/
		date_str = this.FormatDate(undefined, undefined, undefined, 1);
	}
	this.m_interaction_ary[temp_int]["date_str"] = date_str;
	if(time_str == undefined || time_str == "")
	{
		time_str = "00:00:00";
	} 
	else 
	{
		time_str = this.FormatTime(time_str);
	}
	this.m_interaction_ary[temp_int]["time_str"] = time_str;	
}

//OVERRIDDEN
cp.AICC.prototype.SendInteractionData = function(interactionID_str, objectiveID_str, type_str, correctResponse_str, studentResponse_str, result_str, weight_int, latency_str, date_str, time_str, descriptionForInteraction)
{
	var lStudentResponse_str = studentResponse_str;
	if(type_str == "sequencing")
	{
		var lResponses = descriptionForInteraction.answerTexts.learner_response.split('-');
		lStudentResponse_str = lResponses.join(",");
	}
	if(this.IsInteractionDataTracked() && this.IsInitialized())
	{
		if(interactionID_str != undefined && interactionID_str != "")
		{
			this.SetInteractionData(interactionID_str, objectiveID_str, type_str, correctResponse_str, lStudentResponse_str, result_str, weight_int, latency_str, date_str, time_str);
		}
		// Build interaction_data string
		var interaction_data = "";
		interaction_data = 	"\"course_id\"," +
							"\"student_id\"," +
							"\"date\"," +
							"\"time\"," +
							"\"interaction_id\"," +
							"\"objective_id\"," +
							"\"type_interaction\"," +
							"\"correct_response\"," +
							"\"student_response\"," +
							"\"result\"," +
							"\"weighting\"," +
							"\"latency\"" + this.m_return_str;
		for(var interactionItem in this.m_interaction_ary)
		{
			interaction_data = interaction_data +
							"\"0\"," +
							"\"0\"," +
							"\"" + this.m_interaction_ary[interactionItem]["date_str"] + "\","+
							"\"" + this.m_interaction_ary[interactionItem]["time_str"] + "\","+
							"\"" + this.m_interaction_ary[interactionItem]["interactionID_str"] + "\","+
							"\"" + this.m_interaction_ary[interactionItem]["objectiveID_str"] +"\","+
							"\"" + this.m_interaction_ary[interactionItem]["type_str"] +"\","+
							"\"" + this.m_interaction_ary[interactionItem]["correctResponse_str"] +"\","+
							"\"" + this.m_interaction_ary[interactionItem]["studentResponse_str"] +"\","+
							"\"" + this.m_interaction_ary[interactionItem]["result_str"] +"\","+
							"\"" + this.m_interaction_ary[interactionItem]["weight_int"] +"\","+
							"\"" + this.m_interaction_ary[interactionItem]["latency_str"] + "\"" + this.m_return_str;
		}

		// Send Post to Server
		this.AICCbuild("putInteractions", interaction_data);
		// Clear Interaction Array
		this.m_interaction_ary = [];
	}
}



	// ******************************************************************
	// *
	// *     Method:           getTrackingData
	// *      Type:               Global
	// *     Description:      Properly formats a getParam POST to send
	// *                         to an AICC-Compliant LMS.
	// *      Parameters:      None
	// *     Returns:          Nothing
	// * OVERRIDDEN
	// ******************************************************************
cp.AICC.prototype.GetTrackingData = function()
{
	// First, check to see if the data has already been loaded...
	if(!this.IsTrackingDataLoaded() && this.IsInitialized() && !this.m_serverBusy_bln)
	{
		// Automatically set getTrackingData Loaded - prevents multiple calls from occurring
		// this status can change, when the results of the getParam are returned.
		//setTrackingDataLoaded(true);
		this.m_serverBusy_bln = true;

		// Call AICC GetParam function
		this.AICCbuild("getParam", "");
	}
}


	// ******************************************************************
	// *
	// *     Method:           getTrackingDataCore
	// *     Type:             Global
	// *     Description:      Parallel function to SCORM (and other
	// *					  adapters).  Since AICC standard is a single
	// *					  post, we'll *always* return all data
	// *     Parameters:       None
	// *     Returns:          Nothing
	// * OVERRIDDEN
	// ******************************************************************
cp.AICC.prototype.GetTrackingDataCore = function()
{
	if(this.IsInitialized())
	{
		this.GetTrackingData();
	}
}


	// ******************************************************************
	// *
	// *    Method:         setTrackingData
	// *    Type:           Global
	// *    Description:    Requests data from the LMS, through JS
	// *    Date:           02/25/03
	// *    Modified By:    Andrew Chemey
	// *    Parameters:     None
	// *    Returns:        Nothing
	// * OVERRIDDEN
	// ******************************************************************
cp.AICC.prototype.SetTrackingData = function(_scoreRaw_int, _scoreMin_int, _scoreMax_int, _scoreAsPercent_bln, _location_str, _statusCompletion_str, _statusSuccess_str, _statusPreference_bln, _time_str, _resumeData_str,
			_progressMeasure_Number, _sendIncompleteToPassedOrFailed_bln, _beginSendingSuccessStatus_bln)
{
	// call each of the set functions
	if(_scoreAsPercent_bln==true)
	{
		// Set score as a percent
		if(_scoreRaw_int != undefined && _scoreMax_int != undefined && !isNaN(Math.round((_scoreRaw_int/_scoreMax_int)*100)) && _scoreMax_int != 0)
		{
			// based on raw and max
			this.SetScore(this.RoundDecimals((_scoreRaw_int/_scoreMax_int)*100,7));
		} 
		else 
		{
			// based on raw score
			this.SetScore(this.RoundDecimals(_scoreRaw_int,7));
		}
	} 
	else 
	{
		if(_scoreRaw_int != undefined && _scoreMin_int != undefined && _scoreMax_int != undefined)
		{
			this.SetScore(_scoreRaw_int, _scoreMin_int, _scoreMax_int);
		} 
		else if(_scoreRaw_int != undefined && _scoreMax_int != undefined) 
		{
			this.SetScore(_scoreRaw_int, 0, _scoreMax_int);
		} 
		else if(_scoreRaw_int != undefined) 
		{
			this.SetScore(_scoreRaw_int);
		}
	}
	if(_location_str != undefined)
	{
		this.SetLessonLocation(_location_str);
	}
	/*if(_statusPreference_bln != undefined)
	{
		// Preference set for what type of status to store/send
		if(_statusPreference_bln == true && _statusCompletion_str != undefined)
		{
			// send Completion Status
			setLessonStatus(_statusCompletion_str);
		} else if(_statusSuccess_str != undefined) {
			// send Success status
			if(_statusCompletion_str != undefined)
			{
				setLessonStatus(_statusCompletion_str, _statusSuccess_str);
			}
		}
	} else {
		// No preference
		if(_statusCompletion_str != undefined)
		{
			setLessonStatus(_statusCompletion_str);
		} else if(_statusSuccess_str != undefined) {
			setLessonStatus(_statusSuccess_str);
		}
	} */
	
	if(_sendIncompleteToPassedOrFailed_bln)
	{
		this.SetLessonStatus(_statusCompletion_str, _statusSuccess_str);
	}
	else
	{
		if(_statusPreference_bln != undefined && _statusPreference_bln == true)
		{
			//Completion only
			this.SetLessonStatus(_statusCompletion_str);
		}
		else
		{
			this.SetLessonStatus(_statusCompletion_str, _statusSuccess_str);
		}
	}
	// Set Status to default (incomplete, if set to "not started")
	this.SetLessonStatus(this.GetLessonStatus());

	if(_time_str != undefined)
	{
		this.SetTimeInSession(_time_str);
	}
	if(_resumeData_str != undefined)
	{
		this.SetLessonData(_resumeData_str);
	}
}


	// ******************************************************************
	// *
	// *     Method:           sendTrackingData
	// *     Type:             Global
	// *     Description:      Properly formats data and sends to a
	// *                       SCORM-Compliant LMS.
	// *     Parameters:       None
	// *     Returns:          Nothing
	// * OVERRIDDEN
	// ******************************************************************
cp.AICC.prototype.SendTrackingData = function(_scoreRaw_int, _scoreMin_int, _scoreMax_int, _scoreAsPercent_bln, _location_str, _statusCompletion_str, _statusSuccess_str, _statusPreference_bln, _time_str, _resumeData_str,
			_progressMeasure_Number, _sendIncompleteToPassedOrFailed_bln, _beginSendingSuccessStatus_bln)
{
	if(this.IsInitialized())
	{
		var temp_str = "";               // String; Used for temporary purposes.
		
		if(_time_str == undefined)
		{
			_time_str = "";
		}
		this.SetTrackingData(_scoreRaw_int, _scoreMin_int, _scoreMax_int, _scoreAsPercent_bln, _location_str, _statusCompletion_str, 
						_statusSuccess_str, _statusPreference_bln, _time_str, _resumeData_str,
						_progressMeasure_Number, _sendIncompleteToPassedOrFailed_bln, _beginSendingSuccessStatus_bln);


		// Format lesson_Data
		// Nothing to format

		// Build aicc_data string
		this.m_aicc_data = "";
		this.m_aicc_data = this.m_aicc_data + "[Core]" + this.m_return_str;
		
		/*
		if(_statusPreference_bln != undefined)
		{
			if(_statusPreference_bln == true)
			{
				// Completion status
				temp_str = getLessonStatus();
			} else {
				if(getSuccessStatus() != null)
				{
					temp_str = getSuccessStatus();
				} else {
					temp_str = getLessonStatus();
				}
			}
		} else {
			temp_str = getLessonStatus();
		}
		*/
		
		//For Cp6 options
	if(_sendIncompleteToPassedOrFailed_bln)
	{
		if(getSuccessStatus() == "passed")
		{	
			temp_str = this.GetSuccessStatus();
			
		}
		else if(_beginSendingSuccessStatus_bln) 
			{
				temp_str = this.GetSuccessStatus();
			
			}
			
	}
	else 
	{
		/*Set success status only when completion status is "completed"
		Set success status only when the success status in the tracking adapter is not null
		If it is null, assume that user doesnt want to send a success status - new behaviour for Cp6 publish options (this can happen in SCORM 2004)
		*/
		if( this.GetLessonStatus() == "completed" ) 
		{
			temp_str = this.GetLessonStatus();
		}
	}
		
		if(temp_str == "") temp_str = "incomplete";
		
		this.m_aicc_data = this.m_aicc_data + "lesson_status=" + temp_str + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "lesson_location=" + this.GetLessonLocation() + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "score=" + this.GetScore(_scoreAsPercent_bln) + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "time=" + this.GetTimeInSession() + this.m_return_str;
		temp_str = createAndGetDataChunk();
		
		if (temp_str != "")
		{
			this.m_aicc_data = this.m_aicc_data + "[Core_lesson]" + this.m_return_str + temp_str + this.m_return_str;
		}

		// Send Post to Server
		this.AICCbuild("putParam", this.m_aicc_data);

		// Reset the timer variable
		//resetTimer();
	}
}




	// ******************************************************************
	// *
	// *     Method:           SendExitData
	// *     Type:             Global
	// *     Description:      Properly formats an ExitAU POST to send
	// *                       to an AICC-Compliant LMS.
	// *     Parameters:       None
	// *     Returns:          Nothing
	// *
	// ******************************************************************
cp.AICC.prototype.SendExitData = function()
{
	if(this.IsInitialized())
	{
		// Manually call the JS method on ExitAU, because of problems where it's not always called
		//GetURL("javascript:setFinished(true)");

		// Call AICC ExitAU command
		this.AICCbuild("exitAU", "");
	}
}

cp.AICC.prototype.SetTrackingComplete = function()
{
	this.SendExitData();
}
//OVERRIDDEN
cp.AICC.prototype.SetInitialized = function(value_bln)
{
	this.m_initialized = value_bln;
	//GetURL("javascript:setFinished(" + !value_bln + ")");
}


	// AICC Keep-Alive Function
cp.AICC.prototype.KeepSessionAlive = function(this_obj)
{
	if(this_obj.KeepSessionAlive_obj._scoreRaw_int == this_obj.GetScoreRaw() && 
		this_obj.KeepSessionAlive_obj._lessonStatus == this_obj.GetLessonStatus() && 
		this_obj.KeepSessionAlive_obj._successStatus == this_obj.GetSuccessStatus() && 
		this_obj.KeepSessionAlive_obj._lessonData == this_obj.GetLessonData())
	{
		this_obj.KeepSessionAliveTimer_int += this_obj.KeepSessionAliveInterval_int;
	} 
	else 
	{
		this_obj.KeepSessionAliveTimer_int = 0;
	}

	this_obj.KeepSessionAlive_obj._scoreRaw_int = this_obj.GetScoreRaw();
	this_obj.KeepSessionAlive_obj._lessonStatus = this_obj.GetLessonStatus();
	this_obj.KeepSessionAlive_obj._successStatus = this_obj.GetSuccessStatus();
	this_obj.KeepSessionAlive_obj._lessonData = this_obj.GetLessonData();

	if(this_obj.KeepSessionAliveTimer_int <= this_obj.KeepSessionAliveTimeoutInterval_int)
	{
		this_obj.AICCbuild("getParam", "");
	} else {
		clearInterval(this_obj.KeepSessionAliveInterval_var);
		this_obj.KeepSessionAliveInterval_var = "";
		this_obj.Finish();
	}
}

cp.AICC.prototype.SetKeepAlive = function(_keepAliveInterval, _keepAliveLimit)
{
	// Set Interval for KeepAlive (currently used by Veritas);
	KeepSessionAliveInterval_int = _keepAliveInterval;

	KeepSessionAliveTimeoutInterval_int = _keepAliveLimit;

	if(KeepSessionAliveInterval_int > 0)
	{
		if(KeepSessionAliveInterval_var == "")
		{
			KeepSessionAliveInterval_var = setInterval(KeepSessionAlive, KeepSessionAliveInterval_int * 1000, this);
		}
	}
}


	// ******************************************************************
	// *
	// *     Method:           Capitalize
	// *     Description:      Capitalizes the first character of the
	// *                       string that is passed to the function
	// *                       and explicitly forces the rest of the
	// *                       string to be lowercase.
	// *     Returns:          string
	// *
	// ******************************************************************
cp.AICC.prototype.Capitalize = function(s) 
{
	return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
}


	// ******************************************************************
	// *
	// *     Method:           parseINIData
	// *     Description:      Parses the results of posting to an AICC-
	// *                       Compliant LMS, which is in an INI-format
	// *     Returns:		   Object
	// *
	// ******************************************************************
cp.AICC.prototype.ParseTrackingData = function(txt)
{	
	var result_obj = new Object();
	txt = unescape(txt);
	var n;
	var names = new Array('Core', 'Core_lesson', 'Core_vendor', 'Evaluation', 'Objectives_status', 'Student_preferences', 'Student_data', 'Student_demographics');
	var searchText = txt.toLowerCase();
	for(var cur in names)
	{
		var target = "[" + names[cur] + "]";
		while((n = searchText.indexOf(target.toLowerCase())) != -1)
		{
			txt = txt.substring(0, n) + "%^" + names[cur] + "|" + txt.substring(n + 2 + names[cur].length);
			searchText = txt.toLowerCase();
		}
	}
	txt = "Errors|" + txt;
	var content = txt.split("%^");
	txt = "";
	for(var i in content)
	{
		var start = content[i].indexOf("|");
		var self = new Object();
		self.name = content[i].substring(0, start);
		self.blob = content[i].substring(start+1);
		var temp = self.blob.split(this.m_return_str);
		if(self.name=="Core_lesson" || self.name == "Core_vendor")
		{
			var temp_str = temp.join("\r");
			if(temp_str.substr(0,1) == "\r")
			{
				temp_str = temp_str.substr(1);
			}
			this[self.name.toLowerCase()] = temp_str;
		}
		for(var j in temp)
		{
			var eqr;
			eqr = temp[j].indexOf("=");
			if(eqr != -1)
			{
				// possible name/value
				var id = trimStartingAndTrailingSpaces(temp[j].substring(0, eqr)).toLowerCase();
				var val = trimStartingAndTrailingSpaces(temp[j].substring(eqr+1, temp[j].length));
				self[id] = val;
				this[id] = val;
			}
		}
		result_obj[self.name] = self;
	}
	return result_obj;
}
	
cp.Utilities = function(_adapterObject)
{
	var adapterObject = _adapterObject;
}

cp.Utilities.prototype = 
{
	getParameter:function(value_str, search_var, delimiter_str, iDontCallAgain)
    {
		var result_str = "";
        var result_obj = new Object();
        var search_obj = new Object();

        if (delimiter_str == undefined)
        {
            delimiter_str = "=";
        }
		
        if (search_var == undefined || search_var == "")
        {
			search_var = document.referrer;//LocalStage.loaderInfo.url;
            search_var = search_var.split("?");
			if(search_var[1] == undefined)
				search_var = document.location.href.split("?");
        } 
		else 
		{
            search_var = search_var;
            if (typeof(search_var) == "string")
            {
                // Look for different delimiters in string
                if (search_var.indexOf("?") != -1 && search_var.indexOf("=") != -1)
                {
                    // looks like URL parameters
                    search_var = search_var.split("?")[1];
                }

                //var temp_array = ["&", "\r\n", "\r", "\n", ",", ";", "="];
                var temp_array = ["&", "\r\n", "\r", "\n", ",", ";"];
                for (var x = 0; x < temp_array.length; x++)
                {
                    if (search_var.indexOf(temp_array[x]) != -1 && search_var.indexOf("=") != -1) {
                        search_obj = search_var.split(temp_array[x]);
                        break;
                    }
                }
                if(x==temp_array.length && search_var.indexOf(delimiter_str) > -1)
                {
					search_obj[0] = search_var;
				}
            }
        }

        for (var param_str in search_obj)
        {
            if ((typeof(search_obj) == "string" || typeof(search_obj) == "object") && search_obj[param_str].indexOf(delimiter_str) != -1)
            {
                if (value_str != undefined && value_str != "")
                {
                    if (unescape(search_obj[param_str].toString().substr(0, search_obj[param_str].indexOf(delimiter_str)).toLowerCase()) == value_str.toLowerCase())
                    {
                        result_str = search_obj[param_str].substr(search_obj[param_str].indexOf(delimiter_str) + 1, search_obj[param_str].length - 1)
                    }
                } else {
                    result_obj[unescape(search_obj[param_str].toString().substr(0, search_obj[param_str].indexOf(delimiter_str)))] = search_obj[param_str].substr(search_obj[param_str].indexOf(delimiter_str) + 1, search_obj[param_str].length - 1)
                }
            } else {
                if (value_str != undefined && value_str != "")
                {
					if(search_obj[param_str]!="")
					{
						if (param_str.toLowerCase() == value_str.toLowerCase() || search_obj[param_str].toLowerCase() == value_str.toLowerCase())
						{
							result_str = search_obj[param_str]
						}
					}
                } else {
                    result_obj[param_str] = search_obj[param_str];
                }
            }
        }
        if (value_str != undefined && value_str != "")
        {			
			if(result_str == "" && !iDontCallAgain)
				return this.getParameter(value_str, document.referrer, delimiter_str, true);
			return  result_str;	
        } 
		else 
		{
            return result_obj;
        }
    }	
}

cp.Breeze = function(_adapterObject, launchURL)
{
	cp.Breeze.baseConstructor.call(this, _adapterObject, launchURL);
	// Nothing new
	this.m_slideView_ary = [];
	if(_adapterObject != undefined)
	{
		this.SetObjectReference(_adapterObject);
	}

	// Check to see if the constructor was passed the AICC SID and AICC URL parameters
	if(launchURL != undefined)
	{
		this.SetURL(launchURL);
	}
}
cp.inherits(cp.Breeze, cp.AICC);
// ******************************************************************
// *
// *     Method:           SendExitData
// *     Type:             Global
// *     Description:      Overrides the AICC.as version of SendExitData
// *                       so it doesn't call GetURL - since HTML/JS
// *					   won't exist in Breeze
// *     Parameters:       None
// *     Returns:          Nothing
// *OVERRIDDEN
// ******************************************************************
cp.Breeze.prototype.SendExitData = function()
{
	if(this.IsInitialized())
	{
		// Call AICC ExitAU command
		this.AICCbuild("exitAU", "");
	}
}

// ******************************************************************
// *
// *     Method:           SetInitialized
// *     Type:             Global
// *     Description:      Overrides the AICC.as version of SetInitialized
// *                       so it doesn't call GetURL - since HTML/JS
// *					   won't exist in Breeze
// *     Parameters:       Boolean which indicates whether to
// * 					   set as initialized or set as NOT initialized
// *     Returns:          Nothing
// *OVERRIDDEN
// ******************************************************************
cp.Breeze.prototype.SetInitialized = function(value_bln)
{
	this.m_initialized = value_bln;
}

// ******************************************************************
// *
// *    Method:         setTrackingData
// *    Type:           Global
// *    Description:    sets data into tracking adapter object
// *    Date:           02/25/03
// *    Modified By:    Andrew Chemey
// *    Parameters:     None
// *    Returns:        Nothing
// *OVERRIDDEN
// ******************************************************************
cp.Breeze.prototype.SetTrackingData = function(_scoreRaw_int, _scoreMin_int, _scoreMax_int, _scoreAsPercent_bln, _location_str, _statusCompletion_str, _statusSuccess_str, _statusPreference_bln, _time_str, _resumeData_str,
		_progressMeasure_Number, _sendIncompleteToPassedOrFailed_bln, _beginSendingSuccessStatus_bln)
{
	// call each of the set functions
	if(_scoreAsPercent_bln==true)
	{
		// Set score as a percent
		if(_scoreRaw_int != undefined && _scoreMax_int != undefined && !isNaN(Math.round((_scoreRaw_int/_scoreMax_int)*100)) && _scoreMax_int != 0)
		{
			// based on raw and max
			this.SetScore(this.RoundDecimals((_scoreRaw_int/_scoreMax_int)*100,7));
		} else {
			// based on raw score
			this.SetScore(this.RoundDecimals(_scoreRaw_int,7));
		}
	} else {
		if(_scoreRaw_int != undefined && _scoreMin_int != undefined && _scoreMax_int != undefined)
		{
			this.SetScore(_scoreRaw_int, _scoreMin_int, _scoreMax_int);
		} else if(_scoreRaw_int != undefined && _scoreMax_int != undefined) {
			this.SetScore(_scoreRaw_int, 0, _scoreMax_int);
		} else if(_scoreRaw_int != undefined) {
			this.SetScore(_scoreRaw_int);
		}
	}
	if(_location_str != undefined)
	{
		this.SetLessonLocation(_location_str);
	}
	
	
	if(_statusPreference_bln != undefined && _statusPreference_bln == true)
	{
		//Completion only
		this.SetLessonStatus(_statusCompletion_str);
	}
	else
	{
		this.SetLessonStatus(_statusCompletion_str, _statusSuccess_str);
	}
	
	// Set Status to default (incomplete, if set to "not started")
	this.SetLessonStatus(this.GetLessonStatus());

	if(_time_str != undefined)
	{
		this.SetTimeInSession(_time_str);
	}
	if(_resumeData_str != undefined)
	{
		this.SetLessonData(_resumeData_str);
	}
}

//overridden 
cp.Breeze.prototype.SendSuspendData = function(_resumeData_str)
{
	
	if(this.IsInitialized())
	{
		var temp_str = "";               // String; Used for temporary purposes.
		
		if(_resumeData_str != undefined)
		{
			this.SetLessonData(_resumeData_str);
		}

		// Format lesson_Data
		// Nothing to format

		// Build aicc_data string
		this.m_aicc_data = "";
		this.m_aicc_data = this.m_aicc_data + "[Core]" + this.m_return_str;
		var temp_str = "";
		
		this.m_aicc_data = this.m_aicc_data + "lesson_status=" + "incomplete" + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "lesson_location=" + this.GetLessonLocation() + this.m_return_str;
		// Always report absolute score to Breeze.
		this.m_aicc_data = this.m_aicc_data + "score=" + this.GetScore(false) + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "time=" + this.GetTimeInSession() + this.m_return_str;
		temp_str = createAndGetDataChunk();
		
		if (temp_str != "")
		{
			this.m_aicc_data = this.m_aicc_data + "[Core_lesson]" + this.m_return_str + temp_str + this.m_return_str;
		}

		// Send Post to Server
		this.AICCbuild("putParam", this.m_aicc_data);	
	}	
}



// ******************************************************************
// *
// *     Method:           sendTrackingData
// *     Type:             Global
// *     Description:      Properly formats data and sends to a
// *                       SCORM-Compliant LMS.
// *     Parameters:       None
// *     Returns:          Nothing
// *
// ******************************************************************
//override 
cp.Breeze.prototype.SendTrackingData = function(_scoreRaw_int, _scoreMin_int, _scoreMax_int, _scoreAsPercent_bln, 
		_location_str,	_statusCompletion_str, _statusSuccess_str, _statusPreference_bln, _time_str, 
		_resumeData_str, _progressMeasure_Number, _sendIncompleteToPassedOrFailed_bln,
		_beginSendingSuccessStatus_bln)
{
	if(this.IsInitialized())
	{
		var temp_str = "";               // String; Used for temporary purposes.
		
		if(_time_str == undefined)
		{
			_time_str = "";
		}
		this.SetTrackingData(_scoreRaw_int, _scoreMin_int, _scoreMax_int, _scoreAsPercent_bln, _location_str, _statusCompletion_str, 
						_statusSuccess_str, _statusPreference_bln, _time_str, _resumeData_str,
						_progressMeasure_Number, _sendIncompleteToPassedOrFailed_bln, _beginSendingSuccessStatus_bln);


		// Format lesson_Data
		// Nothing to format

		// Build aicc_data string
		this.m_aicc_data = "";
		this.m_aicc_data = this.m_aicc_data + "[Core]" + this.m_return_str;
		
		if(_statusPreference_bln) //send completed for breeze
		{
			temp_str = this.GetLessonStatus();
		}
		else
		{
			temp_str = this.GetSuccessStatus();
		}
		
		
		if(temp_str == "") temp_str = "incomplete";
		
		this.m_aicc_data = this.m_aicc_data + "lesson_status=" + temp_str + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "lesson_location=" + this.GetLessonLocation() + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "score=" + this.GetScore(_scoreAsPercent_bln) + this.m_return_str;
		this.m_aicc_data = this.m_aicc_data + "time=" + this.GetTimeInSession() + this.m_return_str;
		temp_str = createAndGetDataChunk();
		
		if (temp_str != "")
		{
			this.m_aicc_data = this.m_aicc_data + "[Core_lesson]" + this.m_return_str + temp_str + this.m_return_str;
		}

		// Send Post to Server
		this.AICCbuild("putParam", this.m_aicc_data);	
	}
}

//override 
cp.Breeze.prototype.SetSlideView = function(slideNumber_int)
{
	var temp_int = this.m_slideView_ary.length;
	this.m_slideView_ary[temp_int] = new Array();
	this.m_slideView_ary[temp_int]["interactionID_str"] = "breeze-slide-" + slideNumber_int;
	this.m_slideView_ary[temp_int]["objectiveID_str"] = "0";
	this.m_slideView_ary[temp_int]["type_str"] = "slide-view";
	this.m_slideView_ary[temp_int]["correctResponse_str"] = slideNumber_int;
	this.m_slideView_ary[temp_int]["studentResponse_str"] = slideNumber_int;
	this.m_slideView_ary[temp_int]["result_str"] = "correct";
	this.m_slideView_ary[temp_int]["weight_int"] = 1;
	this.m_slideView_ary[temp_int]["latency_str"] = "00:00:00";
	this.m_slideView_ary[temp_int]["date_str"] = this.FormatDate();
	this.m_slideView_ary[temp_int]["time_str"] = "00:00:00";
}

//override 
cp.Breeze.prototype.SendSlideView = function(slideNumber_int)
{
	//cp.log("Inside SendSlideView");
	if(this.IsInitialized())
	{
		var slideNumber = Number(slideNumber_int);
		if(slideNumber >= 0)
		{
			this.SetSlideView(slideNumber_int);
		}
		// Build interaction_data string
		var slideViewData_str = "";
		slideViewData_str = 	"\"course_id\"," +
							"\"student_id\"," +
							"\"date\"," +
							"\"time\"," +
							"\"interaction_id\"," +
							"\"objective_id\"," +
							"\"type_interaction\"," +
							"\"correct_response\"," +
							"\"student_response\"," +
							"\"result\"," +
							"\"weighting\"," +
							"\"latency\"" + this.m_return_str;
		for(var slideViewItem_int in this.m_slideView_ary)
		{
			slideViewData_str = slideViewData_str +
							"\"0\"," +
							"\"0\"," +
							"\"" + this.m_slideView_ary[slideViewItem_int]["date_str"] + "\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["time_str"] + "\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["interactionID_str"] + "\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["objectiveID_str"] +"\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["type_str"] +"\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["correctResponse_str"] +"\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["studentResponse_str"] +"\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["result_str"] +"\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["weight_int"] +"\","+
							"\"" + this.m_slideView_ary[slideViewItem_int]["latency_str"] + "\"" + this.m_return_str;
		}

		// Send Post to Server
		this.AICCbuild("putInteractions", slideViewData_str);
		// Clear Interaction Array
		this.m_slideView_ary = [];
	}
}


function URLEncode(str,iUseEncode)
{
	str = new String(str);
	
	if(iUseEncode)
		str = encodeURI(str);
	else
		str = escape(str);
	str = str.replace(/%20/g, "+");
	
	return str;
}

function escapeJS(js_str)
{
	var char_ary = ["\r", "\t", "\'", "\"", "\\"];
	var return_str = js_str;
	for(var item in char_ary)
	{
		return_str = return_str.split(char_ary[item]).join("\\" + char_ary[item]);
	}
	// fix double-encoding
	return_str = return_str.split("\\\\;").join("\\;");
	return_str = return_str.split("\\\\,").join("\\,");
	return return_str;
}