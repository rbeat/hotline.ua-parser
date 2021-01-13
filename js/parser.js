

var skus = [];
var links = [];
var shops = new Array();
var prices = new Array();
var csrf = '';
var captchaTrigger = 0;


function initiateProcess(){
  if(document.getElementById("skus").value != ""){
    jQuery("#ogBox").fadeOut();
    jQuery("#processBox").fadeOut();
    $("#ogBox").fadeOut('slow', function() {
      document.getElementById("processBox").style.visibility = "visible";
      document.getElementById("processBox").style.height = null;
      document.getElementById("log").value = "";
      jQuery("#processBox").fadeIn();
      $("#processBox").fadeIn('slow', function() {
        parseSkus(document.getElementById("skus"));
      });
    });

  } else {
    alert("Список артикулов пуст. :(");
  }
}

function logger(string){
  var field = document.getElementById("log");
  field.value = field.value + '\r\n' + string + '\r\n';
  field.scrollTop = field.scrollHeight;
  console.log(string);
}

function getLinks(){
  const searchUrl = "https://hotline.ua/sr/?q=";
  for(var i = 0; i<skus.length; i++){
    logger("Получаю данные по SKU: " + parseInt(skus[i]) +"...");
    var temp = '';
        /*
        var req = new XMLHttpRequest();
     req.open('GET', searchUrl + skus[i], false);
        req.send(null);
        temp = req;
        */
        $.ajax({ type: "GET",   
         url: searchUrl + skus[i],   
         async: false,
         cache: false,
         beforeSend: function(request) {


         },
         success : function(text)
         {
           temp = text;
         }
       });
        
        if(new DOMParser().parseFromString(temp, "text/html").getElementsByClassName("products-list cell-list").length > 0){
         temp = new DOMParser().parseFromString(temp, "text/html");

         links[i] = temp.getElementsByClassName("products-list cell-list")[0].getElementsByClassName("h4")[0].getElementsByTagName("a")[0].href;
         links[i] = links[i].split("https://hotline.parser.rbeat.gq").join("https://hotline.ua");
         logger("Получил ссылку: " + links[i]);
         getPrices(links[i],i)
         logger("Готово!");
         logger("-----------");
       }
       else{
         if(temp.indexOf('"card_link"') > 0){
				/*
          temp = new DOMParser().parseFromString(temp, "text/html");
          links[i] = temp.getElementsByClassName("link-blue")[0].href;
          links[i] = links[i].split("https://hotline.parser.rbeat.gq").join("https://hotline.ua");
          */
          temp = temp.substring(temp.indexOf('results: [{')+9, temp.indexOf('}}]')+3);
          temp = JSON.parse(temp);
          if(temp[0].card_link != ""){
            var link_content = temp[0].card_link;
            link_content = link_content.split("\\").join("");
            links[i] = "https://hotline.ua" + link_content;
            logger("Получил ссылку: " + links[i]);
            getPrices(links[i],i)
            logger("Готово!");
            logger("-----------");
          } else {
            links[i] = searchUrl + skus[i];
            logger("Прямой ссылки товара нет. Получаю цены из базы данных Hotline...");
            getPricesFromJSON(temp, i);
            logger("Готово!");
            logger("-----------");
          }
          /*
          temp = temp.substring(temp.indexOf('"card_link":"')+13, temp.indexOf('","hide_guarantee"'));
          temp = temp.split("\\").join("");
          links[i] = "https://hotline.ua" + temp;
          if(links[i] != "https://hotline.ua"){
            logger("Получил ссылку: " + links[i]);
            getPrices(links[i],i)
            logger("Готово!");
            logger("-----------");
          }else{
            links[i] = searchUrl + skus[i];
            logger("Подхватить цены автоматически невозможно.")
            logger("-----------");
          }
          */
        }
        else{
          if(temp.indexOf('Due to the increased activity of the unwanted bots from foreign IP addresses') > -1){
           document.getElementById("continueBar").style.visibility = "visible";
           captchaTrigger = 1;
           logger("Hotline заблокировал доступ парсеру из-за большого кол-ства запросов.");
           logger("В всплывающем окне, пройдите CAPTCHA, чтобы продолжить.");
           logger("Затем, закройте окно и нажмите кнопку \"Продолжить\".");
           alert("Hotline заблокировал доступ парсеру из-за большого кол-ства запросов. В всплывающем окне, пройдите CAPTCHA, чтобы продолжить. Затем, закройте окно и нажмите кнопку \"Продолжить\".");
           var captchawindow = window.open(searchUrl + skus[i], "_blank");
           sleep(3000);
           captchawindow.addEventListener('locationchange', function(){
            i = i - 1;
            captchawindow.close();
          });
           continue;
           
         }else{
           logger("Товар не найден.");
           logger("-----------");
         }
         
       }
     }
   }
   logger("Г О Т О В О!");
   exportCSV();
 }

 function getPricesFromJSON(json,id){
  prices[id] = new Array();
  shops[id] = new Array();
  if(json.length > 0){
    for(var i = 0; i < json.length; i++){
      prices[id][i] = json[i].price_uah_real_raw.toString();
      shops[id][i] = json[i].firm_title.toString();
      logger(shops[id][i] + ": " + prices[id][i]);
    }
    sortPrices(id);
  } else{
    logger("Товар более не доступен.");
  }
}

function getPrices(url, id)
{
  logger("Узнаю цены...");
  var req = new XMLHttpRequest();
  req.open('GET', url, false);
  req.send(null);
  if(req.response.indexOf('Due to the increased activity of the unwanted bots from foreign IP addresses') > -1){
   document.getElementById("continueBar").style.visibility = "visible";
   captchaTrigger = 1;
   logger("Hotline заблокировал доступ парсеру из-за большого кол-ства запросов.");
   logger("В всплывающем окне, пройдите CAPTCHA, чтобы продолжить.");
   logger("Затем, закройте окно и нажмите кнопку \"Продолжить\".");
   alert("Hotline заблокировал доступ парсеру из-за большого кол-ства запросов. В всплывающем окне, пройдите CAPTCHA, чтобы продолжить. Затем, закройте окно и нажмите кнопку \"Продолжить\".");
   var captchawindow = window.open(url, "_blank");
   sleep(3000);
   captchawindow.addEventListener('locationchange', function(){
    getPrices(url,id);
  });
 }
 req = new DOMParser().parseFromString(req.response, "text/html");
 csrf = req.getElementsByName("csrf-token")[0].content;
 var shopUrl = url + "load-prices/";
 var temp = '';
 
 $.ajax({ type: "GET",   
   url: shopUrl,   
   beforeSend: function(request) {
    request.setRequestHeader("x-csrf-token", csrf);
    
  },
  async: false,
  cache: false,
  success : function(json)
  {
   temp = json;
 }
});
 
 if(temp.prices && temp.prices.length > 0){
  prices[id] = new Array();
  shops[id] = new Array();
  for(var i = 0; i < temp.prices.length; i++){
    prices[id][i] = temp.prices[i].price_uah_real_raw.toString();
    shops[id][i] = temp.prices[i].firm_title.toString();
    logger(shops[id][i] + ": " + prices[id][i]);
  }
  sortPrices(id);
}else{
 logger("Товар более не доступен.");
}
}

function sortPrices(id){

 var len = prices[id].length,
 i, j, stop;

 for (i=0; i < len; i++){
  for (j=0, stop=len-i; j < stop; j++){
    if (parseInt(prices[id][j]) - parseInt(prices[id][j+1]) > 0){
      swap(prices[id], j, j+1);
      swap(shops[id], j, j+1);
    }
  }
}
}

function exportLog(){
  let textLog = "data:text/plain;charset=utf-8," + document.getElementById("log").value;
  var encodedUri1 = encodeURI(textLog);
  var hiddenElement1 = document.createElement('a');
  hiddenElement1.href = encodedUri1;
  hiddenElement1.target = '_blank';
  hiddenElement1.download = csrf + '.txt';
  hiddenElement1.click();
}

function exportCSV(){
  let csvContent = "data:text/csv;charset=utf-8,";
  logger("Готовлю CSV на экспорт...");
  csvContent += "SKU,URL,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price,Shop,Price\r\n";
  for(var i = 0; i < skus.length; i++){
    let row = skus[i] + "," + links[i] + ",";
    if(shops[i] != null && prices[i] != null){
      for(var y = 0; y<shops[i].length; y++){
        row += shops[i][y] + "," + prices[i][y] + ",";
      }
    }
    csvContent += row + "\r\n";
  }

  var currentdatetime = new Date(); 
  var filename = "Hotline.parser.rbeat.gq_" + currentdatetime.getDate() + "-"
  + (currentdatetime.getMonth()+1)  + "-" 
  + currentdatetime.getFullYear() + "@"  
  + currentdatetime.getHours() + "-"  
  + currentdatetime.getMinutes() + "-" 
  + currentdatetime.getSeconds();
  var encodedUri = encodeURI(csvContent);
  var hiddenElement = document.createElement('a');
  hiddenElement.href = encodedUri;
  hiddenElement.target = '_blank';
  hiddenElement.download = filename + '.csv';
  document.getElementById("downloadBar").style.visibility = "visible";
  hiddenElement.click();
}

function parseSkus(field){
  var ogText = field.value;
  var ogArray = ogText.split('\n');
  for(var i = 0; i < ogArray.length; i++){
    if(!isNaN(parseInt(ogArray[i]))){
      skus.push(ogArray[i]);
    }
  }
  getLinks();
}

function clearTextArea(){
  document.getElementById("skus").value = "";
}


function getCSRFToken(page) {
  var cookieValue = null;
  if (page.cookie && page.cookie != '') {
    var cookies = page.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      if (cookie.substring(0, 10) == ('csrftoken' + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(10));
        break;
      }
    }
  }
  return cookieValue;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function swap(items, firstIndex, secondIndex){
  var temp = items[firstIndex];
  items[firstIndex] = items[secondIndex];
  items[secondIndex] = temp;
}

function continueCaptcha(){
	captchaTrigger = 0;
	document.getElementById("continueBar").style.visibility = "hidden";
}
