/* main.js */

// URL do JSONP-enabled Web App (Apps Script)
// WAŻNE: wklej tutaj link do wdrożenia zakończony na /exec
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmY3TWK6qXYxEfInU877uuyNIuvm3a9b-u4o6r4WsGgru5F0AhdalXV-a59EXavvd8/exec';

// JSONP helper
function jsonpCall(params) {
  return new Promise(resolve => {
    const cb = 'cb_' + Math.random().toString(36).substr(2);
    window[cb] = data => {
      delete window[cb];
      const tag = document.getElementById(cb);
      if (tag) document.body.removeChild(tag);
      resolve(data);
    };
    const url = new URL(SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v ?? ''));
    url.searchParams.set('callback', cb);
    const s = document.createElement('script');
    s.src = url;
    s.id = cb;
    document.body.appendChild(s);
  });
}

// Przełączanie widoków po ID
function showView(id) {
  document.querySelectorAll('body > div').forEach(d => d.classList.add('hidden'));
  const view = document.getElementById(id);
  if (view) view.classList.remove('hidden');
}

// Po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
  // --- STAN APLIKACJI ---
  let currentCode    = '';
  let currentSymbol  = '';
  let lastHistory    = [];
  let lastLocation   = '';
  let currentMode    = 'home'; // 'check' lub 'change'
  let html5QrCode    = null;
  let scannerTarget  = null;

  // --- ELEMENTY DOM ---
  const modeLabel = document.getElementById('modeLabel');
  function updateMode(name) {
    if (modeLabel) modeLabel.textContent = 'Tryb: ' + name;
  }

  // Ustawienia
  const btnSettings         = document.getElementById('btnSettings');
  const btnBackFromSettings = document.getElementById('btnBackFromSettings');
  const settingsPassword    = document.getElementById('settingsPassword');
  const btnUnlock           = document.getElementById('btnUnlock');
  const settingsForm        = document.getElementById('settingsForm');
  const inputDeviceId       = document.getElementById('inputDeviceId');
  const inputToken1         = document.getElementById('inputToken1');
  const inputToken2         = document.getElementById('inputToken2');
  const btnSaveSettings     = document.getElementById('btnSaveSettings');
  const ADMIN_PASS          = 'TwojeSilneHaslo'; // tu tworzymy hasło do ustawień aplikacji

  // Wybór użytkownika
  const btnSelectUser   = document.getElementById('btnSelectUser');
  const btnBackFromUser = document.getElementById('btnBackFromUser');
  const listUsers       = document.getElementById('listUsers');
  const labelUser       = document.getElementById('labelUser');

  // Dashboard
  const btnCheckLocation  = document.getElementById('btnCheckLocation');
  const btnChangeLocation = document.getElementById('btnChangeLocation');
  const btnAddProduct     = document.getElementById('btnAddProduct');
  const btnSwitchUser     = document.getElementById('btnSwitchUser');

  // Sprawdź lokalizację
  const btnCheckCode   = document.getElementById('btnCheckCode');
  const inputCheckCode = document.getElementById('inputCheckCode');
  const checkResult    = document.getElementById('checkResult');
  const btnRelocate    = document.getElementById('btnRelocate');
  const btnHistory     = document.getElementById('btnHistory');
  const btnScanCheck   = document.getElementById('btnScanCheck');

  // Zmień lokalizację
  const btnFetchForChange = document.getElementById('btnFetchForChange');
  const inputChangeCode   = document.getElementById('inputChangeCode');
  const currentLoc        = document.getElementById('currentLoc');
  const changeScanNew     = document.getElementById('changeScanNew');
  const inputNewLocation  = document.getElementById('inputNewLocation');
  const btnSubmitChange   = document.getElementById('btnSubmitChange');
  const btnScanChange     = document.getElementById('btnScanChange');
  const btnScanNewLocation = document.getElementById('btnScanNewLocation');

  // Dodawanie produktu
  const inputProductName     = document.getElementById('inputProductName');
  const inputProductSymbol   = document.getElementById('inputProductSymbol');
  const inputProductBarcode  = document.getElementById('inputProductBarcode');
  const inputProductLocation = document.getElementById('inputProductLocation');
  const btnScanAddBarcode    = document.getElementById('btnScanAddBarcode');
  const btnScanProductLocation = document.getElementById('btnScanProductLocation');
  const btnSaveProduct       = document.getElementById('btnSaveProduct');
  const addProductResult     = document.getElementById('addProductResult');

  // Skaner kamery
  const scannerBox    = document.getElementById('scannerBox');
  const btnStopScanner = document.getElementById('btnStopScanner');

  // --- SKANER KAMERY ---
  async function startScanner(targetInput, afterScan) {
    if (!window.Html5Qrcode) {
      alert('Biblioteka skanera nie została załadowana. Sprawdź połączenie z internetem.');
      return;
    }

    scannerTarget = { input: targetInput, afterScan };
    scannerBox.classList.remove('hidden');

    if (!html5QrCode) html5QrCode = new Html5Qrcode('reader');

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        },
        async decodedText => {
          if (scannerTarget && scannerTarget.input) scannerTarget.input.value = decodedText;
          await stopScanner();
          if (scannerTarget && typeof scannerTarget.afterScan === 'function') scannerTarget.afterScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      scannerBox.classList.add('hidden');
      alert('Nie udało się uruchomić kamery. Sprawdź uprawnienia przeglądarki oraz czy aplikacja działa przez HTTPS.');
      console.error(err);
    }
  }

  async function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
      await html5QrCode.stop();
      await html5QrCode.clear();
    }
    scannerBox.classList.add('hidden');
  }

  if (btnStopScanner) btnStopScanner.onclick = stopScanner;

  // --- USTAWIENIA ---
  if (btnSettings && btnBackFromSettings && btnUnlock && btnSaveSettings) {
    btnSettings.onclick = () => showView('view-settings');
    btnBackFromSettings.onclick = () => showView('view-home');
    btnUnlock.onclick = () => {
      if (settingsPassword.value === ADMIN_PASS) {
        settingsPassword.value = '';
        settingsForm.classList.remove('hidden');
        btnUnlock.disabled = true;
      } else alert('Błędne hasło');
    };
    btnSaveSettings.onclick = () => {
      localStorage.deviceId = inputDeviceId.value;
      localStorage.token1   = inputToken1.value;
      localStorage.token2   = inputToken2.value;
      showView('view-home');
    };
  }

  // --- WYBÓR UŻYTKOWNIKA ---
  if (btnSelectUser && btnBackFromUser) {
    btnSelectUser.onclick = async () => {
      showView('view-user');
      updateMode('–');
      const res = await jsonpCall({ action:'getUsers', deviceId:localStorage.deviceId, token1:localStorage.token1, token2:localStorage.token2 });
      if (!res.success) return alert(res.error);
      listUsers.innerHTML = '';
      res.users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u;
        li.onclick = async () => {
          const setRes = await jsonpCall({ action:'setActiveUser', deviceId:localStorage.deviceId, token1:localStorage.token1, token2:localStorage.token2, user:u });
          if (!setRes.success) return alert(setRes.error);
          localStorage.currentUser = u;
          labelUser.textContent = u;
          showView('view-dashboard');
          updateMode('–');
        };
        listUsers.appendChild(li);
      });
    };
    btnBackFromUser.onclick = () => showView('view-home');
  }

  // --- DASHBOARD ---
  if (btnCheckLocation) {
    btnCheckLocation.onclick = () => {
      currentMode = 'check';
      updateMode('Sprawdź lokalizację');
      currentCode = '';
      currentSymbol = '';
      lastHistory = [];
      lastLocation = '';
      inputCheckCode.value = '';
      checkResult.textContent = '';
      btnRelocate.classList.add('hidden');
      if (btnHistory) btnHistory.classList.add('hidden');
      showView('view-check');
      inputCheckCode.focus();
    };
  }

  if (btnChangeLocation) {
    btnChangeLocation.onclick = () => {
      currentMode = 'change';
      updateMode('Zmień lokalizację');
      currentCode = '';
      currentSymbol = '';
      lastHistory = [];
      lastLocation = '';
      const infoEl = document.getElementById('productInfo'); if (infoEl) infoEl.remove();
      inputChangeCode.parentElement.classList.remove('hidden');
      if (btnScanChange) btnScanChange.classList.remove('hidden');
      btnFetchForChange.classList.remove('hidden');
      changeScanNew.classList.add('hidden');
      inputChangeCode.value = '';
      showView('view-change');
      inputChangeCode.focus();
    };
  }

  if (btnAddProduct) {
    btnAddProduct.onclick = () => {
      showView('view-add-product');
      inputProductName.value = '';
      inputProductSymbol.value = '';
      inputProductBarcode.value = '';
      inputProductLocation.value = '';
      addProductResult.textContent = '';
      inputProductName.focus();
    };
  }

  if (btnSwitchUser) btnSwitchUser.onclick = () => showView('view-user');

  // --- SKANOWANIE KAMERĄ ---
  if (btnScanCheck) btnScanCheck.onclick = () => startScanner(inputCheckCode, () => btnCheckCode.click());
  if (btnScanChange) btnScanChange.onclick = () => startScanner(inputChangeCode, () => btnFetchForChange.click());
  if (btnScanNewLocation) btnScanNewLocation.onclick = () => startScanner(inputNewLocation, () => btnSubmitChange.click());
  if (btnScanAddBarcode) btnScanAddBarcode.onclick = () => startScanner(inputProductBarcode, () => inputProductLocation.focus());
  if (btnScanProductLocation) btnScanProductLocation.onclick = () => startScanner(inputProductLocation, () => btnSaveProduct.focus());

  // --- SPRAWDŹ LOKACJĘ + PRZEŁÓŻ ---
  const btnBackCheck = document.querySelector('#view-check .btnBack');
  if (btnBackCheck) btnBackCheck.onclick = () => showView('view-dashboard');

  if (btnCheckCode) {
    btnCheckCode.onclick = async () => {
      const res = await jsonpCall({ action:'checkLocation', deviceId:localStorage.deviceId, token1:localStorage.token1, token2:localStorage.token2, code:inputCheckCode.value.trim() });
      if (!res.success) return alert(res.error);
      if (res.found) {
        currentCode = res.code;
        currentSymbol = res.symbol;
        lastHistory = res.history || [];
        lastLocation = res.location;
        checkResult.textContent = `Kod: ${res.code} | Symbol: ${res.symbol} | Lokalizacja: ${res.location || 'brak'}`;
        btnRelocate.classList.remove('hidden');
        if (btnHistory) btnHistory.classList.remove('hidden');
      } else {
        checkResult.textContent = 'Brak produktu w bazie';
      }
    };
    inputCheckCode.onkeydown = e => { if (e.key==='Enter') { e.preventDefault(); btnCheckCode.click(); }};
    if (btnHistory) btnHistory.onclick = () => {
      if (!lastHistory.length) return alert('Brak historii');
      const lines = lastHistory.map(h => `${new Date(h.date).toLocaleString()}: ${h.oldLocation} → ${h.newLocation} (${h.user || 'brak usera'})`);
      alert('Historia zmian:' + '\n' + lines.join('\n'));
    };
    if (btnRelocate) btnRelocate.onclick = () => {
      currentMode = 'check';
      updateMode('Zmień lokalizację');
      showView('view-change');
      inputChangeCode.parentElement.classList.add('hidden');
      if (btnScanChange) btnScanChange.classList.add('hidden');
      btnFetchForChange.classList.add('hidden');
      changeScanNew.classList.remove('hidden');
      currentLoc.textContent = `Aktualna lokalizacja: ${lastLocation || 'brak'}`;
      let infoEl = document.getElementById('productInfo');
      if (!infoEl) {
        infoEl = document.createElement('p');
        infoEl.id = 'productInfo';
        document.getElementById('view-change').insertBefore(infoEl, changeScanNew);
      }
      infoEl.textContent = `Kod: ${currentCode} | Symbol: ${currentSymbol}`;
      inputNewLocation.value = '';
      inputNewLocation.focus();
    };
  }

  // --- ZMIEŃ LOKALIZACJĘ (menu) ---
  if (btnFetchForChange) {
    btnFetchForChange.onclick = async () => {
      const res = await jsonpCall({ action:'checkLocation', deviceId:localStorage.deviceId, token1:localStorage.token1, token2:localStorage.token2, code:inputChangeCode.value.trim() });
      if (!res.success) return alert(res.error);
      if (!res.found) return alert('Kod nie istnieje');
      currentCode = res.code;
      currentSymbol = res.symbol;
      lastHistory = res.history || [];
      lastLocation = res.location;
      currentLoc.textContent = `Aktualna lokalizacja: ${res.location || 'brak'}`;
      inputChangeCode.parentElement.classList.add('hidden');
      if (btnScanChange) btnScanChange.classList.add('hidden');
      btnFetchForChange.classList.add('hidden');
      changeScanNew.classList.remove('hidden');
      inputNewLocation.value = '';
      inputNewLocation.focus();
    };
    inputChangeCode.onkeydown = e => { if (e.key==='Enter') { e.preventDefault(); btnFetchForChange.click(); }};
  }

  // --- ZAPISZ NOWĄ LOKALIZACJĘ ---
  if (btnSubmitChange) {
    btnSubmitChange.onclick = async () => {
      const newLoc = inputNewLocation.value.trim();
      if (!currentCode || !newLoc) return alert('Brak kodu lub nowej lokalizacji');
      const res = await jsonpCall({ action:'setLocation', deviceId:localStorage.deviceId, token1:localStorage.token1, token2:localStorage.token2, code:currentCode, newLocation:newLoc });
      if (!res.success) return alert(res.error);
      alert('Zapisano lokalizację');
      const infoEl = document.getElementById('productInfo'); if (infoEl) infoEl.remove();

      // wróć do trybu, w którym byłeś
      if (currentMode === 'check') {
        updateMode('Sprawdź lokalizację');
        showView('view-check');
        inputCheckCode.value = '';
        checkResult.textContent = '';
        btnRelocate.classList.add('hidden');
        if (btnHistory) btnHistory.classList.add('hidden');
        inputCheckCode.focus();
      } else {
        updateMode('Zmień lokalizację');
        showView('view-change');
        inputChangeCode.parentElement.classList.remove('hidden');
        if (btnScanChange) btnScanChange.classList.remove('hidden');
        btnFetchForChange.classList.remove('hidden');
        changeScanNew.classList.add('hidden');
        inputChangeCode.value = '';
        inputChangeCode.focus();
      }
    };
    inputNewLocation.onkeydown = e => { if (e.key==='Enter') { e.preventDefault(); btnSubmitChange.click(); }};
  }

  // --- DODAJ PRODUKT ---
  if (btnSaveProduct) {
    btnSaveProduct.onclick = async () => {
      const name = inputProductName.value.trim();
      const symbol = inputProductSymbol.value.trim();
      const barcode = inputProductBarcode.value.trim();
      const location = inputProductLocation.value.trim();

      if (!name || !symbol || !barcode) {
        return alert('Uzupełnij nazwę, symbol i kod kreskowy. Lokalizacja jest opcjonalna.');
      }

      const res = await jsonpCall({
        action:'addProduct',
        deviceId:localStorage.deviceId,
        token1:localStorage.token1,
        token2:localStorage.token2,
        name,
        symbol,
        barcode,
        location
      });

      if (!res.success) return alert(res.error);
      addProductResult.textContent = `Dodano produkt ID: ${res.id} | ${res.symbol} | ${res.barcode}`;
      inputProductName.value = '';
      inputProductSymbol.value = '';
      inputProductBarcode.value = '';
      inputProductLocation.value = '';
      inputProductName.focus();
    };

    [inputProductName, inputProductSymbol, inputProductBarcode, inputProductLocation].forEach(input => {
      input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); btnSaveProduct.click(); }};
    });
  }

  // --- POWROTY ---
  const btnBackChange = document.querySelector('#view-change .btnBack');
  if (btnBackChange) btnBackChange.onclick = () => showView('view-dashboard');

  const btnBackAddProduct = document.querySelector('#view-add-product .btnBack');
  if (btnBackAddProduct) btnBackAddProduct.onclick = () => showView('view-dashboard');

  // --- START ---
  showView('view-home');
});
