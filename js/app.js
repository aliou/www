function compileTemplate(template, data) {
  return (template.replace('{{ placeholder }}', data));
}

function trackUrl(data) {
  return '<a href="' + data.url + '" target="_blank">' +
    data.combinedTruncated + '</a>';
}

var wrapper = document.getElementById('music');
var element = document.getElementById('jam');
var xhr = new XMLHttpRequest();

xhr.open('GET', 'http://info.aliou.me/jam')
xhr.onload = function() {
  var response = xhr.responseText;
  if (response) {
    data = JSON.parse(response);
    element.innerHTML = compileTemplate(element.innerHTML, trackUrl(data));
    wrapper.classList.toggle('hidden');
  }
};

document.getElementById('content').onmouseover = function() {
  xhr.send();
  this.onmouseover = null;
}
