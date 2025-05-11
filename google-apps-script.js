/**
 * Script para Google Apps Script que envía datos de gasto de anuncios a la API
 */

// Configuración
const API_URL = "http://localhost:3000/api/import-ad-spend";
const API_KEY = "tu-api-key-secreta"; // Deberías configurar esto en tu aplicación

/**
 * Función que se ejecutará mediante un disparador cada 15 minutos
 */
function sendAdSpendData() {
  try {
    // Obtener la hoja de cálculo activa
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
        "Gastos de Anuncios"
      );
    if (!sheet) {
      Logger.log('No se encontró la hoja "Gastos de Anuncios"');
      return;
    }

    // Obtener datos (asumiendo que las columnas son: adset_id, spend, date)
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    // Extraer encabezados y datos
    const headers = values[0];
    const adsetIdIndex = headers.indexOf("adset_id");
    const spendIndex = headers.indexOf("spend");
    const dateIndex = headers.indexOf("date");

    if (adsetIdIndex === -1 || spendIndex === -1 || dateIndex === -1) {
      Logger.log(
        "Columnas requeridas no encontradas. Necesita: adset_id, spend, date"
      );
      return;
    }

    // Preparar datos para enviar
    const data = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const adsetId = row[adsetIdIndex];
      const spend = Number.parseFloat(row[spendIndex]);
      let date = row[dateIndex];

      // Si la fecha es un objeto Date, convertirla a string YYYY-MM-DD
      if (date instanceof Date) {
        date = Utilities.formatDate(date, "GMT", "yyyy-MM-dd");
      }

      // Validar datos
      if (adsetId && !isNaN(spend) && date) {
        data.push({
          adset_id: adsetId.toString(),
          spend: spend,
          date: date,
        });
      }
    }

    if (data.length === 0) {
      Logger.log("No hay datos válidos para enviar");
      return;
    }

    // Enviar datos a la API
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(data),
      headers: {
        Authorization: "Bearer " + API_KEY,
      },
      muteHttpExceptions: true, // Para poder ver el mensaje de error completo
    };

    const response = UrlFetchApp.fetch(API_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
      const responseJson = JSON.parse(responseText);
      Logger.log("Datos enviados correctamente: " + responseJson.message);

      // Actualizar una celda con la última actualización
      sheet
        .getRange("A1")
        .setNote("Última actualización: " + new Date().toString());
    } else {
      Logger.log(
        "Error al enviar datos: " + responseCode + " - " + responseText
      );
    }
  } catch (error) {
    Logger.log("Error en el script: " + error.toString());
  }
}

/**
 * Función para configurar un disparador que se ejecute cada 15 minutos
 */
function createTrigger() {
  // Eliminar disparadores existentes para evitar duplicados
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendAdSpendData") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Crear nuevo disparador cada 15 minutos
  ScriptApp.newTrigger("sendAdSpendData").timeBased().everyMinutes(15).create();

  Logger.log("Disparador configurado para ejecutarse cada 15 minutos");
}

/**
 * Función para probar el envío de datos manualmente
 */
function testSendData() {
  sendAdSpendData();
}
