let dataFilename = "";
let notFound = document.getElementById("not-found");
let scrollableContent = document.getElementById("scrollable-content");
let footer = document.getElementById("footer");
let productList = document.getElementById("product-list");

function processRoute() {
  const id = window.location.hash.substring(1);

  dataFilename = routes[id];
  
  if(!id || !dataFilename) {
    scrollableContent.style.overflowY = "hidden";
    notFound.style.display = "";
    productList.style.display = "none";
    footer.style.display = "none";
    return;
  } 
  scrollableContent.style.overflowY = "auto";
  notFound.style.display = "none";
  footer.style.display = "";
  productList.style.display = "";

  loadData();
}

function setStorage(key, data) {
  sessionStorage.setItem(key, JSON.stringify(data));
}

function getStorage(key) {
  return JSON.parse(sessionStorage.getItem(key));
}

let totalPrice = document.getElementById("total-price");
let sendBtn = document.getElementById("send-btn");
let products = [];
let productsPerCode = getStorage("productsPerCode") ?? {};

function getProductAndInput(code) {
  const qnt = document.getElementById(`qnt-input-${code}`);
  const product = productsPerCode[code];
  return { qnt, product }
}

function toggleSendBtn() {
  const hasOneProduct = Object.values(productsPerCode).some((product) => product.quantity !== 0);
  sendBtn.disabled = !hasOneProduct;
}

function applyChanges() {
  changeTotalPrice();
  toggleSendBtn();
  setStorage("productsPerCode", productsPerCode);
}

function subtract(code) {
  const { qnt, product } = getProductAndInput(code);
  if(product.quantity === 0) return;
  product.quantity = product.quantity - 1;
  qnt.value = product.quantity;
  applyChanges();
}

function add(code) {
  const { qnt, product } = getProductAndInput(code);
  if(product.quantity === product.maxQuantity) return;
  product.quantity = product.quantity + 1;
  qnt.value = product.quantity;
  applyChanges();
}

function zeroQuantity(code) {
  const { qnt, product } = getProductAndInput(code);
  product.quantity = 0;
  qnt.value = product.quantity;
  applyChanges();
}

function getTotalPrice() {
  return Object.values(productsPerCode).reduce((acc, product) => acc + product.quantity * product.tab1, 0);
}

function changeTotalPrice() {
  const totalValue = getTotalPrice();
  const totalValueStr = String(totalValue).replace(".", ",")
  totalPrice.innerText = normalizeMoney(totalValue);
}

function normalizeMoney(value) {
  return value.toLocaleString("pt-br", {
    style: "currency",
    currency: "BRL",
  });
}

function changeQuantity(value, code) {
  const { qnt, product } = getProductAndInput(code);
  let quantity = parseInt(value);

  if(value === "") {
    product.quantity = 0;
    qnt.value = product.quantity;
    changeTotalPrice();
    toggleSendBtn();
    return;
  }

  if (isNaN(quantity) || quantity < 0) {
    qnt.value = product.quantity;
    changeTotalPrice();
    toggleSendBtn();
    return;
  }

  product.quantity = quantity;
  qnt.value = product.quantity;
  changeTotalPrice();
  toggleSendBtn();
}

function setProductsPerCode() {
  if(Object.keys(productsPerCode).length === 0) {
    products.forEach((product) => productsPerCode[product.code] = {...product, "quantity": 0});
    setStorage("productsPerCode", productsPerCode);
    return;
  }
  applyChanges();
}

async function loadData() {
  if (products.length === 0) {
    try {
      const data = await import("./data/" + dataFilename);
      products = data.products
      setProductsPerCode();
      setProducts();
    }
    catch(err) {
      console.log(`Erro ao carregar produtos ${err}`);
    }
  }
}

function setProducts() {
  let productsHtml = "";
  products.map((product) => {
    const imgName = "./assets/" + product.code.replaceAll('.', '') + ".jpg";
    const productItem = productsPerCode[product.code];
    productsHtml += `
      <div class="product-card">
        <button class="img-btn" onclick="zoomImg('${imgName}')">
          <img class="product-img" src="${imgName}" alt="${product.name}">
        </button>
        <div class="product">
          <div class="product-data">
            <span>${product.name}</span>
            <button class="zero-btn" onclick="zeroQuantity('${product.code}')">
              ⟲ Zerar
            </button>
          </div>
          <div class="product-numbers">
            <div class="input">
              <button class="qnt-btn" onclick="subtract('${product.code}')">-</button>
              <input class="qnt-input" type="number" value="${productItem ? productItem.quantity : 0}" id="qnt-input-${product.code}" oninput="changeQuantity(this.value, '${product.code}')">
              <button class="qnt-btn" onclick="add('${product.code}')">+</button>
            </div>
            <div>
              <span class="price-tag" id="price-${product.code}">${normalizeMoney(product.tab1)}</span>
            </div>
          </div>
        </div>
      </div>
    `
  })
  productList.innerHTML = productsHtml;
}

function formatMessage() {
  const productsStr = Object.keys(productsPerCode).reduce((acc, code) => {
    const product = productsPerCode[code];
    if(product.quantity === 0) return acc + "";
    return acc + `${code} Qtde: ${product.quantity} ${product.name} ${normalizeMoney(product.tab1)}\n`
  }, "")
  const totalPrice = getTotalPrice();
  return productsStr + (`\nTotal do Pedido: ${normalizeMoney(totalPrice)}` ?? "")
}

function sendMessage() {
  let texto = formatMessage();
  
  let textoCodificado = encodeURIComponent(texto);
  
  let numero = "558533113400";
  let linkFinal = `https://wa.me/${numero}?text=${textoCodificado}`;
  
  window.open(linkFinal, '_blank');
}

function zoomImg(src) {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("img-expanded");
  
  modal.style.display = "flex";
  modalImg.src = src;
  history.pushState({ modalAberto: true }, '');
}

function closeZoom() {
  const modal = document.getElementById("image-modal");
  modal.style.display = "none";
  if (history.state && history.state.modalAberto) {
    history.back();
  }
}

import("./routes.js").then((modulo) => {
  window.routes = modulo.routes;
  processRoute();
});

window.addEventListener('popstate', function (event) {
  closeZoom();
});
