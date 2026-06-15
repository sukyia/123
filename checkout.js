/* ═══════════════════════════════════════════════════
   CONFIGURAÇÃO — ajuste antes de publicar
═══════════════════════════════════════════════════ */
var CONFIG = {
  valor:     9.99,
  produto:   'Casa Cheirosa Gastando Pouco',
  apiUrl:    '/api/criar-pix',       // seu backend
  statusUrl: '/api/status-pix',      // seu backend
  accessUrl: 'guia.html', // link do produto
  expiracao: 900                     // 15min em segundos
};

/* ── UTM — captura e persiste na sessão ────────────── */
var utms = (function () {
  var p = {}, s = window.location.search;
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid']
    .forEach(function (k) {
      var m = new RegExp('[?&]' + k + '=([^&]*)').exec(s);
      if (m) p[k] = decodeURIComponent(m[1]);
    });
  if (Object.keys(p).length) sessionStorage.setItem('utms', JSON.stringify(p));
  var saved = sessionStorage.getItem('utms');
  return saved ? JSON.parse(saved) : p;
})();

/* ── helpers ───────────────────────────────────────── */
var $ = function (id) { return document.getElementById(id); };
function showStep(id) {
  document.querySelectorAll('.step').forEach(function (s) { s.classList.remove('active'); });
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ── máscara CPF ───────────────────────────────────── */
$('cpf').addEventListener('input', function () {
  this.value = this.value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
});

/* ── validações ────────────────────────────────────── */
function validCpf(v) {
  v = v.replace(/\D/g, '');
  if (v.length !== 11 || /^(\d)\1+$/.test(v)) return false;
  var s = 0, r;
  for (var i = 0; i < 9; i++) s += +v[i] * (10 - i);
  r = (s * 10) % 11; if (r >= 10) r = 0;
  if (r !== +v[9]) return false;
  s = 0;
  for (var j = 0; j < 10; j++) s += +v[j] * (11 - j);
  r = (s * 10) % 11; if (r >= 10) r = 0;
  return r === +v[10];
}
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function setErr(field, msg) {
  $('err-' + field).textContent = msg;
  $(field).classList.toggle('error', !!msg);
}

function validateForm() {
  var ok = true;
  var nome = $('nome').value.trim();
  var email = $('email').value.trim();
  var cpf = $('cpf').value;

  if (nome.length < 3) { setErr('nome', 'Informe seu nome completo.'); ok = false; }
  else setErr('nome', '');

  if (!validEmail(email)) { setErr('email', 'Informe um e-mail válido.'); ok = false; }
  else setErr('email', '');

  if (!validCpf(cpf)) { setErr('cpf', 'CPF inválido. Verifique e tente novamente.'); ok = false; }
  else setErr('cpf', '');

  return ok;
}

/* ── submit ────────────────────────────────────────── */
$('checkout-form').addEventListener('submit', function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  if (typeof fbq !== 'undefined')
    fbq('track', 'AddPaymentInfo', { value: CONFIG.valor, currency: 'BRL' });

  $('btn-label').hidden = true;
  $('btn-loading').hidden = false;
  $('btn-gerar').disabled = true;

  criarPix({
    nome:    $('nome').value.trim(),
    email:   $('email').value.trim(),
    cpf:     $('cpf').value.replace(/\D/g, ''),
    valor:   CONFIG.valor,
    produto: CONFIG.produto,
    utms:    utms
  });
});

/* ── cria cobrança PIX ─────────────────────────────── */
function criarPix(dados) {
  fetch(CONFIG.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
  .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
  .then(function (d) {
    // d.qrCodeBase64 — imagem base64 (opcional)
    // d.pixCopiaECola — string do PIX
    // d.txid — id da transação
    exibirPix(d.qrCodeBase64 || null, d.pixCopiaECola, d.txid, dados.email);
  })
  .catch(function () {
    /* DEMO — remove em produção e trate o erro */
    var demo = '00020126580014BR.GOV.BCB.PIX0136casa-cheirosa-demo5204000053039865802BR5916CASA CHEIROSA GP6009SAO PAULO62070503***6304DEMO';
    exibirPix(null, demo, 'DEMO001', dados.email);
  });
}

/* ── exibe tela PIX ────────────────────────────────── */
function exibirPix(base64, pixStr, txid, email) {
  showStep('step-pix');
  $('pix-code').value = pixStr;

  // renderiza QR
  $('qr-loading').style.display = 'flex';
  var img = new Image();
  img.onload = function () {
    $('qr-loading').style.display = 'none';
    $('qr-inner').innerHTML = '';
    $('qr-inner').appendChild(img);
  };
  img.style.cssText = 'width:200px;height:200px;border-radius:8px;';
  img.alt = 'QR Code PIX';

  if (base64) {
    img.src = 'data:image/png;base64,' + base64;
  } else {
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='
              + encodeURIComponent(pixStr);
  }

  startCountdown(CONFIG.expiracao);
  startPolling(txid, email);
}

/* ── copiar PIX ────────────────────────────────────── */
function copiarPix() {
  var v = $('pix-code').value;
  if (!v) return;
  navigator.clipboard.writeText(v).then(function () {
    var b = $('btn-copy');
    $('copy-text').textContent = '✓ Copiado!';
    b.classList.add('copied');
    setTimeout(function () {
      $('copy-text').textContent = 'Copiar';
      b.classList.remove('copied');
    }, 2500);
  });
}

/* ── countdown ─────────────────────────────────────── */
var _cd;
function startCountdown(secs) {
  clearInterval(_cd);
  var t = secs;
  tick(t);
  _cd = setInterval(function () {
    t--;
    tick(t);
    if (t <= 0) {
      clearInterval(_cd);
      $('pc-status').innerHTML =
        '<span style="color:#ef4444;font-size:.8rem;font-weight:700;">⏰ QR code expirado — volte e tente novamente.</span>';
    }
  }, 1000);
}
function tick(s) {
  var m = Math.floor(s / 60), sec = s % 60;
  $('countdown').textContent = pad(m) + ':' + pad(sec);
  if (s <= 60) $('pc-timer').style.background = '#fef2f2';
}
function pad(n) { return n < 10 ? '0' + n : n; }

/* ── polling ───────────────────────────────────────── */
var _poll;
function startPolling(txid, email) {
  clearInterval(_poll);
  _poll = setInterval(function () {
    fetch(CONFIG.statusUrl + '?txid=' + encodeURIComponent(txid))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.status === 'PAID') {
          clearInterval(_poll);
          clearInterval(_cd);
          confirmarPagamento(email);
        }
      })
      .catch(function () {});
  }, 5000);
}

/* ── pagamento confirmado ──────────────────────────── */
function confirmarPagamento(email) {
  if (typeof fbq !== 'undefined')
    fbq('track', 'Purchase', {
      value: CONFIG.valor,
      currency: 'BRL',
      content_name: CONFIG.produto
    });

  showStep('step-success');
  $('success-email').textContent = email;
  $('btn-access').href = CONFIG.accessUrl;
}

/* ── voltar ao form ────────────────────────────────── */
function voltarForm() {
  clearInterval(_poll);
  clearInterval(_cd);
  $('btn-label').hidden = false;
  $('btn-loading').hidden = true;
  $('btn-gerar').disabled = false;
  showStep('step-form');
}
