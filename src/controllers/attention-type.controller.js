const { TipoAtencion } = require("../../models/index");
const { createTipoAtencionSchema } = require("../utils/validation");

const getAllTiposAtencion = async (req, res, next) => {
  try {
    const tiposAtencion = await TipoAtencion.findAll({
      order: [["nombre_atencion", "ASC"]],
    });
    res.status(200).json(tiposAtencion);
  } catch (error) {
    next(error);
  }
};

const createTipoAtencion = async (req, res, next) => {
  try {
    const validatedData = createTipoAtencionSchema.parse(req.body);
    const { nombre_atencion } = validatedData;
    const newTipo = await TipoAtencion.create({ nombre_atencion });

    res.status(201).json({
      message: "Tipo de atención creado exitosamente",
      tipo: newTipo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTiposAtencion,
  createTipoAtencion,
};
