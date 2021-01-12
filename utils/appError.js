// Error-Klasse, die operationale Fehler behandelt, d.h. Exceptions

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

// Anmerkungen:
// - der constructor wird immer dann aufgerufen, wenn ein neues Objekt, eine Instanz, der Klasse AppError erstellt wird, z.B. const err = new AppError()
// - dieses neue Objekt enthält die Parameter "message" und "statusCode", die diesem Objekt übergeben werden müssen
// - der Status kann aus dem statusCode ermittelt werden und ist daher als Parameter nicht notwendig
// - caputureStacktrace() sorgt dafür, dass die stackTrace an den client ausgegeben wird, d.h. man kann erkennen, woher der Fehler im Programm kommt
