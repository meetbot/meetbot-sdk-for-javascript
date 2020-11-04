(function () {
  var ORDER_UPDATES_WIDGET_ID = '';
  var CONTENT_BOX_CLASS = 'content-box';
  var CONTENT_BOX_ROW = 'content-box__row text-container';
  var OS_STEP_TITLE_CLASS = 'os-step__title';
  var OS_STEP_SPEC_DESC_CLASS = 'os-step__special-description';
  var MEETBOT_ORDER_UPDATES_CLASS = 'meetbot-order-updates';

  function parse() {
    var e = document.getElementById('shopify_send_messenger')?.getAttribute('data-config');

    if (!e) return;

    var t = JSON.parse(window.atob(e));

    ORDER_UPDATES_WIDGET_ID = t.recall.id;
  }

  function create() {
    if (document.querySelector('div[data-step="thank_you"]') !== null) {
      var orderUpdatesContainer = document.createElement('div');
      orderUpdatesContainer.className = CONTENT_BOX_CLASS + ' ' + MEETBOT_ORDER_UPDATES_CLASS;

      var orderUpdatesRow = document.createElement('div');
      orderUpdatesRow.className = CONTENT_BOX_ROW;

      var orderUpdatesTitle = document.createElement('h2');
      orderUpdatesTitle.className = OS_STEP_TITLE_CLASS;
      orderUpdatesTitle.textContent = 'Get Order Updates in Messenger!';

      var orderUpdatesSpecDesc = document.createElement('div');
      orderUpdatesSpecDesc.className = OS_STEP_SPEC_DESC_CLASS;
      orderUpdatesSpecDesc.style.marginBottom = '0.5714285714em';

      var orderUpdatesDesc = document.createElement('div');
      orderUpdatesDesc.className = 'os-step__description';
      orderUpdatesDesc.textContent = 'Get your receipt on Messenger. Plus, as soon as your order is ready to ship, we’ll notify you there too!';

      var sendToMessenger = document.createElement('div');
      sendToMessenger.id = ORDER_UPDATES_WIDGET_ID;

      orderUpdatesSpecDesc.appendChild(orderUpdatesDesc);

      orderUpdatesRow.appendChild(orderUpdatesTitle);
      orderUpdatesRow.appendChild(orderUpdatesSpecDesc);
      orderUpdatesRow.appendChild(sendToMessenger);

      orderUpdatesContainer.appendChild(orderUpdatesRow);

      var firstContentBox = document.querySelector('.' + CONTENT_BOX_CLASS);
      firstContentBox?.insertAdjacentElement('afterend', orderUpdatesContainer);
    }
  }

  function send() {
    var childNodes = document.getElementsByClassName(MEETBOT_ORDER_UPDATES_CLASS)[0].getElementsByTagName('*');
    for (var i = 0; i < childNodes.length; i++) {
      if (childNodes[i].className === OS_STEP_TITLE_CLASS) {
        childNodes[i].innerHTML = 'Thanks, we’ll send you updates shortly!';
      }
      if (childNodes[i].className === OS_STEP_SPEC_DESC_CLASS) {
        childNodes[i].innerHTML = 'Get your receipt on Messenger. Plus, as soon as your order is ready to ship, we’ll notify you there too!';
      }
      if (childNodes[i].className === CONTENT_BOX_ROW) {
        var nameSpace = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(nameSpace, 'svg');
        svg.setAttribute('xmlns', nameSpace);
        svg.setAttribute('viewBox', '0 0 512 512');
        svg.setAttribute('role', 'img');
        svg.setAttribute('width', '36');
        svg.setAttribute('height', '36');

        var hSectionLine = document.createElementNS(nameSpace, "path");
        hSectionLine.setAttribute('d', 'M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z');
        hSectionLine.setAttribute('fill', '#0084FF');
        svg.appendChild(hSectionLine);
        childNodes[i].appendChild(svg);
      }
    }
    // @ts-ignore
    document.getElementById(ORDER_UPDATES_WIDGET_ID).style.display = 'none';
  }

  //订单结算页
  if (window.Shopify.checkout && window.Shopify.checkout.order_id) {
    if (!window.MEETBOT_SHOPIFY_IS_LOADED) {
      window.MEETBOT_SHOPIFY_IS_LOADED = true;
      parse();
      if (!ORDER_UPDATES_WIDGET_ID) {
        console.error('The widget id not obtained.');
        return
      }
      create();
      var timer = setInterval(() => {
        if (window.FB) {
          clearInterval(timer);
          window.FB.Event.subscribe('send_to_messenger', function (e) {
            if (e.event === 'opt_in') {
              window.MEETBOT_SHOPIFY_IS_LOADED = undefined;
              send();
            }
          });
        }
      }, 1000)
    }
  }

})()