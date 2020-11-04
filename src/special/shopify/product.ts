import { get } from 'src/lib/http';
import { CheckboxData, DiscountData } from 'src/widget';
import { Config, getCustomUserId } from './utils';

/** 获取商品表单元素 */
function getProductForm() {
  /** 页面的所有表单元素 */
  const forms = document.getElementsByTagName('form');
  // 迭代所有表单元素
  for (let i = 0; i < forms.length; i++) {
    // 带有`cart/add`的标记就是所求
    if (forms[i].action.match(/cart\/add/)) {
      return forms[i];
    }
  }
}

/** 获取当前用户选项 */
function getSelectedVariantId() {
  const { meta } = window.ShopifyAnalytics;

  // 如果页面已经写入选中的 VariantId，则直接返回
  if (meta && meta.selectedVariantId) {
    return meta.selectedVariantId;
  }

  // 商品表单元素
  const form = getProductForm();

  if (!form) {
    return;
  }

  const formSelection = form.id as any as HTMLSelectElement;
  const options = formSelection.options && formSelection.options[formSelection.selectedIndex];
  const value: string = options ? options.value : (formSelection && formSelection.value);

  if (value) {
    meta.selectedVariantId = value;
    return value;
  }
}

/** 获取添加购物车按钮 */
function getAddToCartBtn() {
  const form = getProductForm();

  if (form) {
    const addToCart = form.querySelector('input[type=submit], button[name=add], button[data-action="add-to-cart"]');

    if (addToCart) {
      return addToCart;
    }
  }
}

/** 将 DOM 插入至 “加入购物车按钮” 后 */
function insertDomAfterCart(html: (width: number) => string) {
  // 获取页面添加购物车按钮
  const btn = getAddToCartBtn();

  // 没有找到添加按钮，退出
  if (!btn) {
    return;
  }

  const formStyle = (btn.parentElement ? btn.parentElement : btn).getBoundingClientRect();
  const wrapper = document.createElement('div');

  wrapper.innerHTML = html(formStyle.width);

  // 元素本身
  const dom = wrapper.firstElementChild!;
  // 插入元素
  btn.parentElement!.insertBefore(dom, btn.nextElementSibling);

  return dom;
}

/** 将 DOM 插入至 form 后 */
function insertDomAfterForm(html: (width: number) => string) {
  // 页面的表单元素
  const form = getProductForm();

  if (!form) {
    return;
  }

  const formStyle = form.getBoundingClientRect();
  const wrapper = document.createElement('div');

  wrapper.innerHTML = html(formStyle.width);

  // 元素本身
  const dom = wrapper.firstElementChild!;
  // 插入元素
  form.parentElement!.insertBefore(dom, form.nextElementSibling);

  return dom;
}

/** checkbox 初始化 */
function initCheckbox(config: NonNullable<typeof Config.recall>) {
  let isChecked = false;

  const data: Partial<CheckboxData> = {
    id: config.id,
    origin: location.origin,
    centerAlign: true,
    check: () => isChecked = true,
    unCheck: () => isChecked = false,
    rendered: () => {
      if (dom) {
        dom.lastElementChild!.textContent = config.intro_text || null;
      }
    },
  };

  window.BH.Widget.setConfig(data);

  let dom: Element | undefined = document.getElementById('meetbot-shopify-checkbox-wrapper') || undefined;

  if (!dom) {
    dom = insertDomAfterCart((width) => (
      `<div id="meetbot-shopify-checkbox-wrapper" style="display: flex; justify-content: center; flex-direction: column; width: ${width}px">` +
      `<div style="text-align: center;" id="${data.id}"></div>` +
      '<div style="text-align: center;"></div>' +
      '</div>'
    ));
  }

  return function ckeckboxSubscribed() {
    if (isChecked && dom) {
      dom.lastElementChild!.textContent = config.subscribed_text || null;
    }
  };
}

/** discount 初始化 */
function initDiscount(config: NonNullable<typeof Config.recall>) {
  const data: Partial<DiscountData> = {
    id: config.id,
    origin: location.origin,
    getCode: () => get(`shopify/cartsbot/${Config.shop_id}/discount-code-for-widget/${getCustomUserId()}`).then(({ data }) => ({
      code: data.code,
      message: data.text,
      isSubscribed: Boolean(data.has_subscribed),
    })),
  };

  window.BH.Widget.setConfig(data);

  insertDomAfterCart((width) => (
    `<div style="display: flex; justify-content: center; flex-direction: column; width: ${width}px">` +
    `<div style="text-align: center;" id="${data.id}"></div>` +
    '</div>'
  ));
}

/** 商品召回初始化 */
export function initAddToCard() {
  if (!Config.recall) {
    return;
  }

  /** 按钮按下的回调函数 */
  let btnClick = () => { };

  if (Config.recall.type === 'checkbox') {
    btnClick = initCheckbox(Config.recall);
  }
  else if (Config.recall.type === 'discount') {
    initDiscount(Config.recall);
  }

  // 获取页面添加购物车按钮
  const btn = getAddToCartBtn();

  // 没有找到添加按钮，退出
  if (!btn) {
    return;
  }

  // 按钮绑定事件
  btn.addEventListener('click', () => {
    // 回调运行
    btnClick();

    // 搜索当前页面的选中元素
    const skuId = getSelectedVariantId();

    if (!skuId) {
      console.warn('(Meetbot SDK) 未找到选中的 SKU');
      return;
    }

    const { ShopifyAnalytics, BH: { Event } } = window;
    const { currency, product } = ShopifyAnalytics.meta;

    const skuData = product!.variants.find(({ id }) => id === +skuId);

    if (!skuData) {
      console.warn('(Meetbot SDK) 选中的 SKU 编号错误，未找到对应的 SKU 数据');
      return;
    }

    const messengerCheckboxObj = document.getElementsByClassName("fb-messenger-checkbox")[0];
    const app_id = messengerCheckboxObj.getAttribute("messenger_app_id");
    const page_id = messengerCheckboxObj.getAttribute("page_id");
    const user_ref = messengerCheckboxObj.getAttribute("user_ref");
    const fb_content_id = product!.variants[0].id;
    const fb_content_value = product!.variants[0].price;
    const fb_currency = currency;
    const fb_content_type = product!.type;
    const user_agent = navigator.userAgent;
    const customer_user_id = window.localStorage.meetbot_custom_user_id.replace(/^\"|\"$/g, '');
    const ref = {
      'ev': "fb_mobile_add_to_cart",
      'params': {
        "fb_content_id": fb_content_id,
        "fb_content_type": fb_content_type,
        "fb_currency": fb_currency,
        "fb_content_value": fb_content_value
      },
      'code': 'widget',
      'user_agent': user_agent,
      'gateway': 'engagement',
      'fb_user_id': '',
      'id': page_id + "_" + user_ref,
      'custom_user_id': customer_user_id
    };
    var jsonStrRef = JSON.stringify(ref);
    console.log("checkbox data", app_id, page_id, user_ref, ref);
    window.FB.AppEvents.logEvent('MessengerCheckboxUserConfirmation', null, {
      'app_id': app_id,
      'page_id': page_id,
      'ref': jsonStrRef,
      'user_ref': user_ref
    });
  });

  return;
}
