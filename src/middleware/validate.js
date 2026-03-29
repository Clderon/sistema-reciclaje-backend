/**
 * Factory que devuelve un middleware Express que valida req.body
 * contra el schema Joi recibido.
 *
 * En caso de error devuelve 400 con el primer mensaje de validación.
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,    // detiene en el primer error (mensajes más simples)
      stripUnknown: true,  // elimina campos no declarados en el schema (seguridad)
    });

    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: error.details[0].message,
      });
    }

    // Reemplaza req.body con el valor saneado (campos extras eliminados)
    req.body = value;
    next();
  };
}

module.exports = validate;
