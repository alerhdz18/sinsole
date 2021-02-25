//this is it
//https://externals.ujet.co/assets/ding_dong_soft-20181214.mp3
function sec_to_time(sec,shrt){
  shrt=shrt||false;
  if(isNaN(parseInt(sec)))
    return "-:-:-";
  var time=[],sec=Math.abs(sec);
  time.push(Math.floor(sec/3600));
  time.push(Math.floor(sec/60)%60);
  time.push(Math.floor(sec%60));
  $.each(time,function(ind,ele){
    time[ind]=(ele<10?"0":"")+ele;

  });
  if(shrt&&time[0]=="00"){
    if(time[1]=="00")time.splice(0,1);
    time.splice(0,1);
  }
  return time.join(":");
}
function isNumeric(n) {
     return !isNaN(parseFloat(n)) && isFinite(n);
}
function time_to_sec(str){
  if(!/^(\d+:)?[0-5]?\d:[0-5]?\d$/.test(str))
    return false;
  var comp=str.split(":").reverse(),sec=0;
  
  for(var i=0;i<=comp.length-1;i++){
    sec+=comp[i]*Math.pow(60,i)
  }
  return sec;
}
if(window.self === window.top){
	function loadMedia(src,callback){
		if(src.split(".").reverse()[0]=="js"){
		var ele = document.createElement('script');
			ele.src = src;
		}else{
			var ele = document.createElement('link');
			ele.href = src;
			ele.rel="stylesheet";
		}
		if(typeof callback=="function")
			ele.onload=callback;
		document.body.appendChild(ele);
	}
var js = [
			{
				main:'//ajaxorg.github.io/ace-builds/src-min-noconflict/ace.js',
				childs:['//ajaxorg.github.io/ace-builds/src-min-noconflict/ext-language_tools.js'],
			}
		];
  js.forEach(ele=>{
	
	loadMedia(ele.main,function(){
		ele.childs.forEach(src=>{
			loadMedia(src)
		})
	})
  })
  
var sinsole={
	data:{
		Agents:{},
		call:{},
		chat:{},
		summary:{},
		calls_over:function(sec){
			return this.call_queue.filter(e=>Date.now()-new Date(e.connected_at).getTime()>sec*1000).length;
		},
		calls_longest:function(){
			var longest_call=Math.max.apply(null,this.call_queue.filter(e=>e.type!="DirectCall"&&isNumeric(e.call_duration)).map(a=>{ return (Date.now()-new Date(a.connected_at))/1000 }));
			return sec_to_time(longest_call);
		},
		chats_over:function(sec){
			return this.chat_queue.filter(e=>Date.now()-new Date(e.assigned_at).getTime()>sec*1000).length;
		},
		chats_longest:function(){
			var longest_chat=Math.max.apply(null,this.chat_queue.filter(e=>isNumeric(e.chat_duration)).map(a=>{ return (Date.now()-new Date(a.assigned_at))/1000 }));
			return sec_to_time(longest_chat);
		},
},DURL:{}},MyLog=document.querySelector("#MyLog");
(function(XHR) {
  "use strict";
  var open = XHR.prototype.open;
  var send = XHR.prototype.send;
  XHR.prototype.open = function(method, url, async, user, pass) {this._url = url;open.call(this, method, url, async, user, pass);};
  XHR.prototype.send = function(data) {
    var self = this;
    var oldOnReadyStateChange;
    var url = this._url;
    var valids=[{
          'reg':/\/v1\/agent_statuses\?channel=(voice_call|chat)/gm,
          callback:function(match,rD){
            if(sinsole.data){
              
			  rD.forEach(ag=>{sinsole.data.Agents[ag.id]=ag;});
			  
              sinsole.data.Agents.last_update=rD.last_update;
			  if(sinsole.update){
				  if(!url.includes("manual")){
					sinsole.update.agent_statuses(match=="chat"?"voice_call":"chat");
					sinsole.update.dashboard();
				  }
				  
			  }
            }
          }
        },{
          'reg':/\/v1\/agent_statuses\/summary\?channel=(voice_call|chat)/gm,
          callback:function(match,rD){
            if(sinsole.data){
              sinsole.data.summary[match]=rD;
			  if(sinsole.update&&!url.includes("manual")){
                sinsole.update.agent_summary(match=="chat"?"voice_call":"chat")
              }
            }
          }
        },{
          'reg':/\/v1\/dashboard\/(chat|call)/ig,
          callback:function(match,rD){
			  var aux={};
			  rD.logged_in_agents.forEach(e=>{
				e.name=e.name.toLowerCase().replace(/[^a-z0-9]/gi,'_');
				aux[e.name]=e.count;
			  });
			  rD.status=aux;
			  if(match=="chat"){
				  rD.chats_per_agent=rD.live_status_breakdown.ongoing/rD.agents_in_comm;
			  }
              sinsole.data[match]=rD;
              if(sinsole.update){
				  
				if(!url.includes("manual")){
					
					sinsole.update.dashboard(match=="chat"?"call":"chat");
					sinsole.update.agent_statuses()
				}
				
			  }
          },
      },{
          'reg':/\/v1\/(calls|chats)\?/ig,
          callback:function(match,rD){
			  if(match=="calls"){
				  rD=rD.map(e=>{
					  e.call_duration=(Date.now()-new Date(e.connected_at).getTime())/1000;
					  return e;
				  });
			  }else{
				  rD=rD.map(e=>{
					  e.chat_duration=(Date.now()-new Date(e.assigned_at).getTime())/1000;
					  return e;
				  });
			  }
			  
              sinsole.data[match=="calls"?'call_queue':'chat_queue']=rD;
			  if(sinsole.update){
				if(!url.includes("manual")){
					sinsole.update.queue(match=="calls"?"chats":"calls");
				}
			  }
          },
      }];
    function onReadyStateChange() {
      if(self.status === 200 && self.readyState == 4 /* complete */) {
        var rD={};
        var path=url.split("?")[0];
		try{
          rD=JSON.parse(self.responseText);
          rD["last_update"]=Date.now();
        }catch(er){}
        valids.forEach(e=>{
            var m;
            while((m=e.reg.exec(url)) !==null){
                if (m.index === e.reg.lastIndex) {
                  e.reg.lastIndex++;
                }
				if(!sinsole.updates){
					sinsole.updates={};
				}
				if(typeof sinsole.updates[path]=='undefined'){
					sinsole.updates[path]=[];
				}
				sinsole.updates[path].push(rD.last_update);
				
                e.callback(m[1],rD);
				if(sinsole.notify)
					sinsole.notify.scan()
            }
        })
        if(url.includes("/v1/")){
          
          try{
            sinsole.DURL[path]=JSON.parse(self.responseText)
          }catch(er){
            sinsole.DURL[path]=(self.responseText)
          }
        }
      }
      if(oldOnReadyStateChange) {
        oldOnReadyStateChange();
      }
    }
    if(this.addEventListener) {
      this.addEventListener("readystatechange", onReadyStateChange,
        false);
    } else {
      oldOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = onReadyStateChange;
    }
    send.call(this, data);
  }
})(XMLHttpRequest);
  window.onload=function(){

	MyLog=document.querySelector("#MyLog");
	if(MyLog ==null){
		MyLog = document.createElement('div');
		MyLog.id="MyLog";
		
		document.body.appendChild(MyLog);
		MyLog.insertAdjacentHTML('beforeend',`
		<div class="logheader"> 
			<button class="logsize" value="30%">Log</button>
			<div class="controls">
				<button class="logsize" value="0%">0%</button>
				<button class="logsize" value="20%">20%</button>
				<button class="logsize" value="30%">30%</button>
			</div>
		</div>
		<ol class="logcontainer"></ol>`)
		
		document.body.insertAdjacentHTML('beforeend',`<style>
			#MyLog {position: fixed;bottom: 0px;left: 0px;height: 100%;width: 0px;background: white;box-shadow: 0px 0px 10px #ccc;}
			.logheader .controls{float:right;}
			#MyLog ol{padding: 2px 5px 2px 25px;font-family: monospace;font-size: 11px;overflow: auto;height: 100%;width: 100%;}
			#MyLog li{white-space: pre-wrap;padding-top:5px;border-top:1px solid #ccc}
			#MyLog li:nth-child(even){ background:#f2f2f2 }
			.showpanel{
				display:none;
			}
			.mini #notipanel {
				height: 37px;
				top: revert !important;
				width: 61px !important;
				padding: 0px !important;
				background:#28b351 !important;
			}
			.mini #notipanel>h3,.mini #notipanel>#notilist,.mini #notipanel .hidepanel {
				display:none
			}
			.mini #notipanel .showpanel{
				display:inline-block
			}
			 ::-webkit-scrollbar {
				height: 18px;
				width: 16px;
				
			}
			::-webkit-scrollbar-button {
				background-color: rgb(255, 255, 255);
				background-repeat: no-repeat;
				cursor: pointer;
			}

			::-webkit-scrollbar-corner {
				background-color: rgb(255, 255, 255);
			}

			::-webkit-scrollbar-thumb {
				border-radius: 9px;
				
				border: solid 5px rgb(255, 255, 255);
				background-color: rgb(200, 200, 200);
			}
			::-webkit-scrollbar-thumb:hover {
				background-color: rgb(150, 150, 150);
			}
			::-webkit-scrollbar-track {
				background-color: rgb(255, 255, 255);
			}
			#notipanel h3{
				border-bottom:1px solid #ccc;
				margin-bottom:5px;
				width:100%;
			}
			#notipanel h4 input{
				width:100%;
			}
			.conditions {
				padding: 2px 5px 2px 20px;
				list-style-position: outside;
				max-height: 0px;
				opacity: 0;
				overflow: hidden;
				transition-property: max-height,opacity;
				transition-duration: 0.2s,0.2s;
				transition-delay: 0s, .3s;
			}
			.condition [name=left],.condition [name=right],.condition .ace_editor {
				display: inline-block;
				width: calc(50% - 25px);
				box-shadow: 0px 0px 1px 1px #ccc;
				padding: 3px;
				font-size: 12px;
				resize: none;
				height: 20px !important;
				overflow: hidden;
				white-space: pre;
				border: none;
				line-height: 1;
			}
			.condition .ace_editor{
				margin-bottom: -5px !important;
			}
			.condition {
				padding: 2px 30px 2px 2px;
				position:relative;
			}
			#notilist{
				overflow: auto;
				height: calc(100% - 58px);
				width: 100%;
				padding-bottom: 15px;
			}
			.message textarea, .title input {
    width: 99%;
    box-shadow: inset 0px 0px 1px;
    padding: 5px;
    font-size: 13px;
    color: #1A237E;
    font-family: system-ui;
    background: #f2f2f2;
    border: none;
    resize: vertical;
    max-height: 100px;
    min-height: 27px;
}
#notilist b>button{
	float: right;
	height: 20px;
	line-height: 1;
	padding: 2px 7px;
	background: #FFEB3B;
}
#notilist>li {
    padding: 5px 10px;
    margin-bottom:5px;
    border-bottom:1px solid #ccc;
}
#notilist>li:nth-child(even){
    background:#f2f2f2;
}
#notilist>li:nth-child(even) .message textarea, #notilist>li:nth-child(even) .title input{
    background:white
}
#notilist li .action{
    text-align:right;
}
#notilist li .save{
    background:#2196F3;
    color:white;
    border-radius:4px;
    
}
.condition .condinfo{
    position: absolute;
	top:0px;
	right: 0px;
    padding: 1px 1px;
	width:25px;
}
body.maxpanel {
    margin-right: 500px;
}
.condinfo .delcond {
    padding: 0px 2px;
    line-height: 0.8;
    font-family: monospace;
    background: #FF5722;
    color: white;
    border-radius: 50%;
    box-shadow: 1px 1px 3px #b53d17;
}
.table.ongoing-chats-table,.table.ongoing-calls-table {
    padding: 0px;
}
.ongoing-chats-table td,.ongoing-calls-table td{
    padding:0px !important;
    margin: 0px !important;
}
.ongoing-chats-table td .table-content,.ongoing-calls-table td .table-content{
    padding:0px 5px !important;
}
.ongoing-chats-table td .table-content button.actions,.ongoing-calls-table td .table-content button.actions{
    height:10px!important;
}
.ongoing-chats-table tr:nth-child(even),.ongoing-calls-table tr:nth-child(even){
    background:#eee;
}

		</style>`)
		$("#MyLog .logsize").click(function(){
			$("body").css("padding-left",this.value);
			$("#MyLog").css("width",this.value);
		})
	}
	sinsole=$.extend(sinsole,{
		getType:function(este){
			return este===null?"null":este.constructor.toString().split(" ")[1].replace(/[\)\(]/g,"").toLowerCase()
		},
		htmlEntities:function (str) {
			return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		},
		format: function (html) {
			var tab = '\t';
			var result = '';
			var indent= '';
			html.split(/>\s*</).forEach(function(element) {
				if (element.match( /^\/\w/ )) {
					indent = indent.substring(tab.length);
				}
				result += indent + '<' + element + '>\r\n';
				if (element.match( /^<?\w[^>]*[^\/]$/ )) { 
					indent += tab;
				}
			});
			return result.substring(1, result.length-3);
		},
		log: function(obj){
		  obj=obj===null?"null":obj;
			var container=MyLog.querySelector(".logcontainer")
			var txt='';
			var type=this.getType(obj);
			switch(type) {
				case "string":
				case "number":
					txt=obj;
				break;
				case "object":
				case "array":
					txt=this.htmlEntities(JSON.stringify(obj,null,2));
				break;
				default:
						txt=/.*element/ig.test(type)?this.htmlEntities(this.format(obj.outerHTML)):obj.toString();
			}
			container.insertAdjacentHTML('beforeend','<li><small>'+(new Date()).toISOString()+'</small><br>'+txt+'</li>')
		},
		clear:function(){
			MyLog.querySelector(".logcontainer").innerHTML='';
				return this;
		},
		getDataKeys(){
			var ob={};
			Object.keys(sinsole.data).forEach(ds=>{
				
				if(ds=="chat"||ds =="call"){
				Object.keys(sinsole.data[ds]).forEach(k=>{
					var type=sinsole.getType(sinsole.data[ds][k]);
					if("object"==type){
						Object.keys(sinsole.data[ds][k]).forEach(kl=>{
							var ltype=sinsole.getType(sinsole.data[ds][k][kl]);
							if(ltype=='number')
								ob[ds+"."+k+"."+kl]=ltype;
						});
					}else if(type=='number'){
						ob[ds+"."+k]=type;
					}
				 });    
				}
			});
			
			return [{
				getCompletions: function(editor, session, pos, prefix, callback) {
					callback(null,Object.keys(ob).map(function(k){return {caption:k,value:k,meta:ob[k]}}));
				}
			}];
		},
		setEditor(ele){
			var editor = ace.edit(ele);
			ele.style.display='inline-block';
			
			editor.completers = sinsole.getDataKeys();
			editor.setOptions({
			  enableBasicAutocompletion: true,
			  enableSnippets: true,
			  enableLiveAutocompletion: true, 
			  maxLines: 1, // make it 1 line
			  autoScrollEditorIntoView: true,
			  highlightActiveLine: false,
			  
			  showGutter: false,
			});
			editor.on("paste", function(e) {
				e.text = e.text.replace(/[\r\n]+/g, " ");
			});
			// make mouse position clipping nicer
			editor.renderer.screenToTextCoordinates = function(x, y) {
				var pos = this.pixelToScreenCoordinates(x, y);
				return this.session.screenToDocumentPosition(
					Math.min(this.session.getScreenLength() - 1, Math.max(pos.row, 0)),
					Math.max(pos.column, 0)
				);
			};
			var textarea=$("#"+ele.id.replace("editor_",""));
			textarea.hide();
			editor.getSession().on('change', function(){
			  textarea.val(editor.getSession().getValue());
			});
			// disable Enter Shift-Enter keys
			editor.commands.bindKey("Enter|Shift-Enter", "null");
			editor.getSession().setUseWorker(false);
			editor.setTheme("ace/theme/clouds");
			editor.getSession().setMode("ace/mode/javascript");
		},
		notify:{
			rules:[
				{
					"id": "base1",
					"conditions": [
					  {
						"left": "chats_over(700)",
						"oper": ">",
						"right": "0"
					  }
					],
					"message": "Chats over target: ${_.chats_over(700)}.\nMax chat Durations: ${_.chats_longest()}",
					"title": "Chat AHT",
					"active": true,
					"noti": false,
					"wait": 30000,
					"noti_show_at": 0
				},
				{
					"id": "base2",
					"conditions": [
					  {
						"left": "calls_over(400)",
						"oper": ">",
						"right": "0"
					  }
					],
					"message": "Calls over target: ${_.calls_over(400)}.\nMax call Durations: ${_.calls_longest()}",
					"title": "Call AHT",
					"active": true,
					"noti": {},
					"wait": 30000,
					"noti_show_at": 1614292448207
				}
			],
			evaluate(i){
				var noty=this;
				var valid=true;
				noty.rules[i].conditions.forEach(c=>{
					var left=c.left,right=c.right;
					if(!isNumeric(left)){
						left="sinsole.data."+left;
					}
					if(!isNumeric(right)){
						right="sinsole.data."+right
					}
					var cvalid=false;
					try{
						
						cvalid=(eval(left+c.oper+right))
					}catch(er){}
					valid=valid&&cvalid;
				});
				return valid;
			},
			renderRule(index){
				this.rules[index];
			},
			renderPanel(){
				var noty=this;
				var panel=document.querySelector("#notipanel");
				
				if(panel===null){
					document.body.insertAdjacentHTML('beforeend',`
					   <div id="notipanel" style="position:fixed;width:500px;top:0px;bottom:10px;right:5px;background:white;padding:10px;box-shadow:0px 0px 5px 1px #ccc;border-radius: 5px;">
						<h3 style="borde-bottom:1px solid #ccc">Notification config</h3>
						<ul id="notilist">
						</ul>
						<div class="panel-footer" style="box-shadow:0px 15px 10px -15px #ccc;padding:5px">
							<button class="hidepanel">hide</button>
							<button class="showpanel">Notify</button>
						</div>
					   </div>
					`);
					panel=document.querySelector("#notipanel");
					
					panel.querySelector(".hidepanel").addEventListener("click",function(){
						document.body.classList.add("mini");
						document.body.classList.remove("maxpanel")
					});
					panel.querySelector(".showpanel").addEventListener("click",function(){
						document.body.classList.remove("mini");
						document.body.classList.add("maxpanel")
					});
					document.body.classList.add("mini")
				}
				var rules=panel.querySelector("#notilist");
				rules.innerHTML='';
				noty.rules.forEach((rule,rindex)=>{
					
					var lirule=`<li rule-id="${rule.id}">
					<input type="hidden" name="id" value="${rule.id}">
					<div class="title"><b>Title:<button onclick="sinsole.notify.showAlert(${rindex})">test</button></b><br/><input name="title" style="border:none;background:transient" placeholder="title" value="${rule.title}"></div>
					<div class="message"><b>Message:</b><br/><textarea placeholder="Message" name="message">${rule.message}</textarea></div>
					<h5 class="showhidecond">Conditions</h5> 
					<ol class="conditions">`;
					rule.conditions.forEach((cond,ind)=>{
						lirule+=noty.addCondition(cond,rule.id,ind);
					});
					lirule+=`</ol>
					<div class="action">
						<button class="save" onclick="sinsole.notify.saveRule('${rule.id}')">Save</button>
						<button class="addcond" onclick="sinsole.notify.addCondition(null,'${rule.id}')">Add Condition</button>
					</div>
					</li>`;
					rules.insertAdjacentHTML('beforeend',lirule);
				});
				panel.querySelectorAll('[ace][id*="editor_"]:not(.ace_editor)').forEach(ele=>{
					sinsole.setEditor(ele)
				});
				panel.querySelectorAll(".showhidecond").forEach(e=>{
					var papa=e.parentElement;
					e.addEventListener('click',function(){
						var cnd=papa.querySelector(".conditions");
						var display=cnd.style.opacity==0;
						if(display){
							cnd.style["max-height"]='100px';
							cnd.style["opacity"]=1;
						}else{
							cnd.style["max-height"]='0px';
							cnd.style["opacity"]=0;
						}
						
					})
				})
			},
			addRule(){
				
			},
			
			addCondition(cond,ruleIndex,condIndex){
				var noty=this;
				var opers=['>','>=','<','<=','<>','='];
				cond=$.extend({left:"",oper:">",right:""},cond);
                
				if(typeof condIndex=="undefined"){
					if(typeof ruleIndex !=="undefined"){
						var li=document.querySelector("#notilist li[rule-id='"+ruleIndex+"'] .conditions");
						condIndex=li.childElementCount;
					}else{
						condIndex="_";
					}
					
				}
				
				var optHtml=opers.map(o=>{
					return `<option value="${o}" ${cond.oper==o?"selected":""}>${sinsole.htmlEntities(o)}</option>`;
				}).join("");
				
				var html=`<li class="condition">
					<textarea id="${ruleIndex}_${condIndex}_left" name="left">${cond.left}</textarea>
					<div style="display:none" ace id="editor_${ruleIndex}_${condIndex}_left">${cond.left}</div>
					<select name="oper">
						${optHtml}
					</select>
					<textarea id="${ruleIndex}_${condIndex}_right" name="right">${cond.right}</textarea>
					<div style="display:none" ace id="editor_${ruleIndex}_${condIndex}_right">${cond.right}</div>
					<div class="testarea"></div>
					<div class="condinfo">
						<button class="delcond" onclick="sinsole.notify.delCondition(this)">⁄</button>
						<span class="test"></span>
					</div>
					</li>`;
				if(typeof ruleIndex !=="undefined"){
					var li=document.querySelector("#notilist li[rule-id='"+ruleIndex+"'] .conditions")
					if(li!==null){
						
						li.insertAdjacentHTML('beforeend',html);
						li.querySelectorAll('[ace][id*="editor_"]:not(.ace_editor)').forEach(ele=>{
							sinsole.setEditor(ele)
						})
						
					}
				}
				return html;
			},
			ruleObjTemplate(){
				return {
					id:"base-"+document.querySelector("#notilist").childElementCount+"-"+Date.now()+"-"+Math.round(Math.random()*86400),
					conditions:[],
					message:'',
					title:'',
					active:true,
					noti:false,
					wait:30000,
					noti_show_at:0
				};
			},
			delCondition(ele){
				var li=ele.parentElement.parentElement;
				li.parentNode.removeChild(li);
			},
			saveRule(ruleIndex){
				var noty=this;
				var li=document.querySelector("#notilist li[rule-id='"+ruleIndex+"']");
				if(li!==null){
					var old=noty.rules.filter(ru=>ru.id==ruleIndex);
					var newRule=noty.ruleObjTemplate();
					newRule.id=ruleIndex;
					newRule.message=li.querySelector("[name='message']").value;
					newRule.title=li.querySelector("[name='title']").value;
					li.querySelectorAll(".condition").forEach(c=>{
						var cond={left:"",oper:"",right:""};
						cond.left=c.querySelector("[name='left']").value;
						cond.oper=c.querySelector("[name='oper']").value;
						cond.right=c.querySelector("[name='right']").value;
						newRule.conditions.push(cond)
					});
					if(old.length==1){
						old=old[0];
						var index=sinsole.notify.rules.findIndex(e=>e.id==ruleIndex);
						sinsole.notify.rules[index]=$.extend(old,newRule);
						
					}else{
						noty.rules.push(newRule);
					}
					localStorage["notify_rules"]=JSON.stringify(sinsole.notify.rules);
				}
			},
			compileText(str){
				var compiled=str;
				const regex = /\$\{([\w\(\)\.\_\+\-\/]+)\}/gmi;
				var dregex=new RegExp('^('+Object.keys(sinsole.data).join("|")+'|\_)\.(.*)$','g')
				let m;
				while ((m = regex.exec(str)) !== null) {
					if (m.index === regex.lastIndex) {
						regex.lastIndex++;
					}
					try{
						var value=eval(m[1].replace(dregex,'sinsole.data.$1.$2').replace('._.','.'));
						compiled=compiled.replace(m[0],value)
					}catch(er){}
				}
				return compiled;
			},
			showAlert(i){
				var noty=this;
				
				if(Date.now()-noty.rules[i].noti_show_at>noty.rules[i].wait && noty.rules[i].active==true){
					var body=noty.compileText(noty.rules[i].message);
					var title=noty.compileText(noty.rules[i].title);
					noty.rules[i].noti=new Notification(title, {
						body: body,
						icon: "https://ujet.s3.us-west-2.amazonaws.com/instacart/company/global_avatar/83/data_uri_upload20191202-26634-fydnbt.png"
					});
					noty.rules[i].noti_show_at=Date.now();
					noty.rules[i].noti.onclick=function(){
						window.focus();
						noty.rules[i].noti.close();
						noty.rules[i].noti=false;
					}
					setTimeout(function(){
						if(noty.rules[i].noti){
							noty.rules[i].noti.close();
							noty.rules[i].noti=false;
							noty.rules[i].noti_show_at=0;
						}
					},15000)
				}
			},
			notifications:[],
			scan:function(){
				var noty=this;
				noty.rules.forEach((r,i)=>{
					if(noty.evaluate(i)===true){
						noty.showAlert(i)
					}
				})
			},
			stop:function(){
				
			}
		},
		update:{
			dashboard:function(type){
				type=typeof type =="undefined"?"both":type;
				var u=(new Date(new Date().toDateString())).getTime();
				var start=(new Date(u)).toISOString().split(".")[0]+"Z";
				var end=(new Date(u+86399000)).toISOString().split(".")[0]+"Z";
				if(type=="call"||type=="both")
				  $.get("/v1/dashboard/call?time_frame[from]="+start+"&time_frame[to]="+end+"&time_frame[unit]=900&m=manual");
				if(type=="chat"||type=="both")
				  $.get("/v1/dashboard/chat?time_frame[from]="+start+"&time_frame[to]="+end+"&time_frame[unit]=900&m=manual");
			},
			agent_statuses:function(type){
			  type=typeof type =="undefined"?"both":type;
				if(type=="call"||type=="both")
				  $.get("/v1/agent_statuses?channel=voice_call&m=manual");
				if(type=="chat"||type=="both")
				  $.get("/v1/agent_statuses?channel=chat&m=manual")
			},
			agent_summary:function(type){
			  type=typeof type =="undefined"?"both":type;
				if(type=="voice_call"||type=="both")
				  $.get("/v1/agent_statuses/summary?channel=voice_call&m=manual")
				if(type=="chat"||type=="both")
				  $.get("/v1/agent_statuses/summary?channel=chat&m=manual")
			},
			queue:function(type){
				type=typeof type =="undefined"?"both":type;
				if(type=="calls"||type=="both")
					$.get('/v1/calls?sort_column=connected_at&sort_direction=asc&status[]=assigned&status[]=ongoing&status[]=va_assigned&m=manual');
				if(type=="chats"||type=="both")
					$.get('/v1/chats?sort_column=assigned_at&sort_direction=asc&status[]=assigned&status[]=ongoing&status[]=va_assigned&m=manual');
			}
		}
	});
	if(localStorage["notify_rules"]){
		var ru=JSON.parse(localStorage["notify_rules"]);
		sinsole.notify.rules=ru;
	}
	sinsole.notify.renderPanel();
	ace.require("ace/ext/language_tools")
}
}
