// Backup_JSONP_Code.gs
// JSONP endpoint for PWA with dual-key search and history functionality

/**
 * Walidacja tokenów dla deviceId
 */
function checkTokens(deviceId, token1, token2) {
  var authSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Autoryzacje");
  var data = authSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === deviceId) {
      return token1 === data[i][1] && token2 === data[i][2];
    }
  }
  return false;
}

/**
 * Główna brama JSONP (GET)
 */
function doGet(e) {
  var p = e.parameter;
  var deviceId = p.deviceId;
  var token1   = p.token1;
  var token2   = p.token2;
  var action   = p.action;
  var key      = p.code || p.searchKey;
  var newLoc   = p.newLocation;
  var user     = p.user;
  var result;

  if (!checkTokens(deviceId, token1, token2)) {
    result = { success:false, error:"Brak autoryzacji — tokeny lub deviceId nieprawidłowe!" };
  } else {
    switch(action) {
      case 'getUsers':
        result = getUsers_();
        break;
      case 'setActiveUser':
        result = setActiveUser_(deviceId, user);
        break;
      case 'checkLocation':
        result = checkLocation_(key);
        break;
      case 'setLocation':
        result = setLocation_(deviceId, key, newLoc);
        break;
      default:
        result = { success:false, error:"Nieznana akcja: " + action };
    }
  }

  var callback = p.callback || 'callback';
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * Pobranie listy użytkowników
 */
function getUsers_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Uzytkownicy");
  var users = sheet.getDataRange().getValues().flat();
  return { success:true, users:users };
}

/**
 * Ustawienie aktywnego usera dla deviceId
 */
function setActiveUser_(deviceId, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var userSheet = ss.getSheetByName("Uzytkownicy");
  var userList = userSheet.getDataRange().getValues().flat();
  if (userList.indexOf(user) < 0) {
    return { success:false, error:"Nie ma takiego usera!" };
  }
  var activeSheet = ss.getSheetByName("AktywniUzytkownicy");
  if (!activeSheet) {
    activeSheet = ss.insertSheet("AktywniUzytkownicy");
    activeSheet.appendRow(["deviceId","user","timestamp"]);
  }
  var data = activeSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === deviceId) {
      activeSheet.getRange(i+1,2).setValue(user);
      activeSheet.getRange(i+1,3).setValue(new Date());
      found = true;
      break;
    }
  }
  if (!found) activeSheet.appendRow([deviceId, user, new Date()]);
  return { success:true, message:"User ustawiony." };
}

/**
 * Sprawdzenie lokalizacji po code lub symbol wraz z historią zmian
 */
function checkLocation_(searchKey) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Magazyn");
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var symbol = rows[i][2].toString();
    var code   = rows[i][3].toString();
    if (searchKey === code || searchKey === symbol) {
      var location = rows[i][4];
      // Pobierz ostatnie 3 zmiany z HistoriiZmian
      var histSheet = ss.getSheetByName("HistoriaZmian");
      var histData = histSheet.getDataRange().getValues();
      var history = [];
      for (var j = histData.length - 1; j > 0 && history.length < 3; j--) {
        if (histData[j][2].toString() === code) {
          history.push({
            date:        histData[j][0],
            oldLocation: histData[j][3],
            newLocation: histData[j][4],
            user:        histData[j][5]
          });
        }
      }
      return { success:true, found:true, code:code, symbol:symbol, location:location, history:history };
    }
  }
  return { success:true, found:false };
}

/**
 * Ustawienie lub zmiana lokalizacji po code lub symbol
 */
function setLocation_(deviceId, searchKey, newLocation) {
  if (!searchKey || !newLocation) {
    return { success:false, error:"Brak kodu lub lokalizacji!" };
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = ss.getSheetByName("AktywniUzytkownicy");
  if (!activeSheet) return { success:false, error:"Brak aktywnego użytkownika!" };
  var activeData = activeSheet.getDataRange().getValues();
  var activeUser = '';
  for (var a = 1; a < activeData.length; a++) {
    if (activeData[a][0] === deviceId) {
      activeUser = activeData[a][1];
      break;
    }
  }
  if (!activeUser) {
    return { success:false, error:"Brak aktywnego użytkownika dla tego urządzenia!" };
  }
  var sheet = ss.getSheetByName("Magazyn");
  var rows = sheet.getDataRange().getValues();
  var found = false, oldLoc='', code='', symbol='';
  for (var i = 1; i < rows.length; i++) {
    var rowSym  = rows[i][2].toString();
    var rowCode = rows[i][3].toString();
    if (searchKey === rowCode || searchKey === rowSym) {
      found = true;
      code   = rowCode;
      symbol = rowSym;
      oldLoc = rows[i][4];
      sheet.getRange(i+1,5).setValue(newLocation);
      break;
    }
  }
  if (!found) {
    return { success:false, error:"Produkt nie istnieje w bazie Magazyn!" };
  }
  var histSheet = ss.getSheetByName("HistoriaZmian");
  histSheet.appendRow([new Date(), symbol, code, oldLoc, newLocation, activeUser]);
  return { success:true, message:"Lokalizacja zaktualizowana.", code:code, symbol:symbol, oldLocation:oldLoc, newLocation:newLocation };
}
