(function(){
"use strict";
const MAP = {
 CIH_AirSampling:"Air Sampling & Instrumentation", CIH_AnalyticalChemistry:"Analytical Chemistry",
 CIH_BasicScience:"Basic Science", CIH_Biohazards:"Biohazards", CIH_BiostatsEpi:"Biostatistics & Epidemiology",
 CIH_CommunityExposure:"Community Exposure", CIH_EngineeringControls:"Engineering Controls / Ventilation",
 CIH_Ergonomics:"Ergonomics", CIH_RiskAnalysis:"Health Risk Analysis & Hazard Communication",
 CIH_IHProgram:"IH Program Management", CIH_Noise:"Noise", CIH_NonEngineeringControls:"Non-Engineering Controls",
 CIH_Radiation:"Radiation — Ionizing & Non-ionizing", CIH_ThermalStress:"Thermal Stressors",
 CIH_Toxicology:"Toxicology", CIH_WorkEnvironments:"Work Environments & Industrial Processes"
};
const V2 = {Ventilation_LEV:"Engineering Controls / Ventilation",Noise:"Noise",Radiation:"Radiation — Ionizing & Non-ionizing",
 Thermal_Stress:"Thermal Stressors",Statistics_Evaluation:"Biostatistics & Epidemiology",
 General_Science_Exposure:"General Science / Exposure (cross-domain)",
 Sampling_Analytical_Respirators:"Sampling / Analytical / Respirators (cross-domain)",
 Integrated_Problem_Solving:"Integrated / Cross-domain"};
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function categoryFor(card){
 const tags=(card.tags||"").split(/\s+/);
 for(const t of tags) if(MAP[t]) return MAP[t];
 if((card.deck||"").startsWith("V2")) for(const t of tags) if(V2[t]) return V2[t];
 return "Other / Unmapped";
}
function ratedRecords(){
 return Object.keys(state.cards||{}).map(k=>{
  const i=Number(k),s=state.cards[k];
  if(!Number.isInteger(i)||!CARDS[i]||!s||![1,2,3,4].includes(Number(s.lastRating)))return null;
  return {i,rating:Number(s.lastRating),category:categoryFor(CARDS[i]),reviews:Number(s.reviews)||1,lastReviewed:s.lastReviewed||""};
 }).filter(Boolean);
}
function render(){
 const panel=$("analyticsPanel");if(!panel||panel.hidden)return;
 const records=ratedRecords(),groups={};
 records.forEach(r=>{
  const x=groups[r.category]||(groups[r.category]={category:r.category,cards:0,attempts:0,good:0,fail:0,hard:0,easy:0});
  x.cards++;x.attempts+=r.reviews;if(r.rating>=3)x.good++;if(r.rating===1)x.fail++;if(r.rating===2)x.hard++;if(r.rating===4)x.easy++;
 });
 const metrics=Object.values(groups).map(x=>({...x,success:x.cards?100*x.good/x.cards:0,failRate:x.cards?100*x.fail/x.cards:0}));
 const totalCards=records.length,attempts=records.reduce((n,r)=>n+r.reviews,0);
 const good=records.filter(r=>r.rating>=3).length,fails=records.filter(r=>r.rating===1).length;
 $("analyticsSummary").innerHTML='<div class="an-kpi"><b>'+totalCards+'</b><span>cards with a rating</span></div>'+
 '<div class="an-kpi"><b>'+attempts+'</b><span>total review attempts</span></div>'+
 '<div class="an-kpi"><b>'+(totalCards?Math.round(100*good/totalCards):0)+'%</b><span>latest ratings Good/Easy</span></div>'+
 '<div class="an-kpi"><b>'+(totalCards?Math.round(100*fails/totalCards):0)+'%</b><span>latest ratings Fail</span></div>';
 const minN=Number($("analyticsMin").value)||5;
 const usable=metrics.filter(x=>x.category!=="Other / Unmapped").sort((a,b)=>a.success-b.success||b.cards-a.cards);
 const enough=usable.filter(x=>x.cards>=minN);
 $("analyticsPriority").innerHTML=enough.length?enough.slice(0,3).map(x=>'<div class="an-priority"><b>'+esc(x.category)+'</b><span>'+Math.round(x.success)+'% Good/Easy · '+x.cards+' rated cards</span></div>').join(""):'<p class="an-muted">Not enough rated cards in any category yet. The dashboard will become more useful as you review.</p>';
 $("analyticsCategories").innerHTML=usable.length?usable.map(x=>{
  const color=x.success>=80?"var(--good)":x.success>=60?"var(--warn)":"var(--bad)";
  return '<div class="an-row"><div class="an-rowtop"><b>'+esc(x.category)+'</b><span>'+Math.round(x.success)+'% · '+x.cards+' cards</span></div>'+
  '<div class="an-track"><div style="width:'+Math.round(x.success)+'%;background:'+color+'"></div></div>'+
  '<div class="an-detail">Attempts: '+x.attempts+' · Fail: '+Math.round(x.failRate)+'% · Hard: '+x.hard+' · Easy: '+x.easy+'</div></div>';
 }).join(""):'<p class="an-muted">No rated cards yet. Start reviewing and rate each card to build your dashboard.</p>';
 const trend=$("analyticsTrend"),history=Array.isArray(state.history)?state.history.filter(x=>x&&x.at&&!x.legacy):[];
 if(history.length<2)trend.innerHTML='<p class="an-muted">Trend will appear after at least two new reviews with analytics enabled. Existing saved progress contributes to category results, but older rating changes were not stored as a timeline.</p>';
 else{
  const days={};history.forEach(x=>{const d=String(x.at).slice(0,10);if(!days[d])days[d]={n:0,good:0};days[d].n++;if(Number(x.rating)>=3)days[d].good++;});
  const vals=Object.keys(days).sort().slice(-14);
  trend.innerHTML='<div class="an-trend">'+vals.map(d=>'<div class="an-day"><div class="an-barwrap"><div class="an-bar" style="height:'+Math.max(3,days[d].good/days[d].n*100)+'%"></div></div><b>'+Math.round(100*days[d].good/days[d].n)+'%</b><span>'+esc(d.slice(5))+'</span></div>').join("")+'</div><p class="an-muted">Daily share of new ratings marked Good/Easy; days with more reviews are more informative.</p>';
 }
 $("analyticsNote").textContent="Results use your latest rating per card for category comparisons. Good/Easy is a self-rated recall proxy, not an objective exam score. Cross-domain V2 topics are shown separately from the official CIH categories.";
}
const style=document.createElement("style");
style.textContent="#analyticsBtn{white-space:nowrap} #analyticsPanel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin:0 0 14px;max-height:calc(100dvh - 110px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;box-sizing:border-box} #analyticsPanel .an-head{position:sticky;top:-14px;z-index:2;background:var(--panel);padding:4px 0 10px} #analyticsPanel h2{font-size:19px;margin:0 0 5px} #analyticsPanel h3{font-size:14px;margin:17px 0 9px} #analyticsPanel .an-muted{font-size:12px;color:var(--muted);line-height:1.45} #analyticsPanel .an-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:12px 0} #analyticsPanel .an-kpi{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:4px} #analyticsPanel .an-kpi b{font-size:23px} #analyticsPanel .an-kpi span{font-size:11px;color:var(--muted)} #analyticsPanel .an-priority{display:flex;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid var(--line);font-size:12px} #analyticsPanel .an-priority span{color:var(--muted);text-align:right} #analyticsPanel .an-row{margin:11px 0 14px} #analyticsPanel .an-rowtop{display:flex;justify-content:space-between;gap:8px;font-size:12px;align-items:baseline} #analyticsPanel .an-rowtop span{white-space:nowrap;color:var(--muted)} #analyticsPanel .an-track{height:7px;background:var(--panel2);border-radius:99px;overflow:hidden;margin:6px 0} #analyticsPanel .an-track>div{height:100%;border-radius:99px} #analyticsPanel .an-detail{font-size:11px;color:var(--muted)} #analyticsPanel .an-trend{display:flex;gap:5px;align-items:flex-end;overflow-x:auto;min-height:120px} #analyticsPanel .an-day{min-width:30px;flex:1;text-align:center;font-size:10px} #analyticsPanel .an-barwrap{height:70px;background:var(--panel2);border-radius:5px;display:flex;align-items:flex-end;overflow:hidden} #analyticsPanel .an-bar{width:100%;background:var(--accent);border-radius:4px 4px 0 0} #analyticsPanel .an-day b,#analyticsPanel .an-day span{display:block;margin-top:4px} #analyticsPanel .an-day span{color:var(--muted)} @media(min-width:600px){#analyticsPanel .an-summary{grid-template-columns:repeat(4,minmax(0,1fr))}}";
document.head.appendChild(style);
const header=document.querySelector("header"),reset=$("resetBtn");
if(header&&reset){
 const wrap=document.createElement("div");wrap.style.cssText="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end";
 const btn=document.createElement("button");btn.id="analyticsBtn";btn.textContent="Analytics";btn.type="button";
 reset.parentNode.insertBefore(wrap,reset);wrap.appendChild(btn);wrap.appendChild(reset);
}
const panel=document.createElement("section");panel.id="analyticsPanel";panel.hidden=true;
panel.innerHTML='<div class="an-head"><div><h2>CIH performance</h2><div class="an-muted">Local analysis of your saved review progress</div></div><button id="closeAnalytics" type="button">Close</button></div>'+
'<div id="analyticsSummary" class="an-summary"></div><h3>Study priorities</h3><div class="an-muted">Categories ranked by latest Good/Easy rate. Minimum rated cards: <select id="analyticsMin" style="padding:4px 6px"><option value="3">3</option><option value="5" selected>5</option><option value="10">10</option></select></div><div id="analyticsPriority"></div>'+
'<h3>Performance by CIH category / topic</h3><div id="analyticsCategories"></div><h3>Recent trend</h3><div id="analyticsTrend"></div><p id="analyticsNote" class="an-muted"></p>';
header.insertAdjacentElement("afterend",panel);
$("analyticsBtn").addEventListener("click",()=>{panel.hidden=!panel.hidden;if(!panel.hidden){render();panel.scrollIntoView({behavior:"smooth",block:"start"});}});
$("closeAnalytics").addEventListener("click",()=>{panel.hidden=true;});
$("analyticsMin").addEventListener("change",render);
document.getElementById("resetBtn").addEventListener("click",()=>setTimeout(render,0));
window.addEventListener("storage",render);
render();
})();