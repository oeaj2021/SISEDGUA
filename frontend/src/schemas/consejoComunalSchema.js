import { z } from 'zod';

export const consejoComunalSchema = z
  .object({
    nacionalidad: z.enum(['V', 'E'], {
      required_error: 'Seleccione nacionalidad (V / E)'
    }),
    cedula: z
      .string()
      .trim()
      .regex(/^\d{6,8}$/, 'La cédula debe contener solo números (entre 6 y 8 dígitos)'),
    nombres_apellidos: z
      .string()
      .trim()
      .min(3, 'Ingrese al menos 3 caracteres')
      .max(100, 'Máximo 100 caracteres permitidos')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo debe contener letras y espacios'),
    telefono: z
      .string()
      .trim()
      .regex(
        /^(0412|0414|0424|0416|0426)\d{7}$/,
        'Ingrese un número válido con prefijo venezolano (0412, 0414, 0424, 0416, 0426) y 7 dígitos'
      ),
    genero: z.enum(['Hombre', 'Mujer'], {
      message: 'Seleccione su género (Hombre o Mujer)'
    }),
    edad: z
      .preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z
          .number({ message: 'Ingrese una edad válida' })
          .int('La edad debe ser un número entero')
          .min(15, 'La edad mínima permitida es 15 años')
          .max(100, 'La edad máxima permitida es 100 años')
      ),
    tipo_personal: z.enum(
      [
        'Docente',
        'Obrero',
        'Administrativo',
        'Cocinera(o) de la Patria',
        'Directivo / Supervisor',
        'Otro'
      ],
      {
        message: 'Seleccione el tipo de personal'
      }
    ),
    tipo_personal_otro: z.string().trim().optional(),
    institucion_educativa: z
      .string()
      .trim()
      .min(3, 'Indique la institución educativa donde labora')
      .max(200, 'Máximo 200 caracteres'),
    municipio: z.string().min(1, 'Seleccione un municipio del Estado Guárico'),
    parroquia: z.string().min(1, 'Seleccione una parroquia'),
    comunidad: z
      .string()
      .trim()
      .min(3, 'Indique el nombre de la comunidad o sector')
      .max(150, 'Máximo 150 caracteres'),
    circuito_comunal: z.string().trim().max(120).optional().or(z.literal('')),
    comuna: z.string().trim().max(120).optional().or(z.literal('')),
    participa_asambleas: z
      .boolean({
        invalid_type_error: 'Debe responder si participa activamente en asambleas'
      }),
    forma_parte_comite: z
      .boolean({
        invalid_type_error: 'Debe indicar si forma parte de algún comité'
      }),
    comite: z.string().optional().or(z.literal('')),
    comite_otro: z.string().trim().optional()
  })
  .superRefine((data, ctx) => {
    // Si selecciona "Otro" en tipo de personal, es obligatorio detallar
    if (data.tipo_personal === 'Otro') {
      if (!data.tipo_personal_otro || data.tipo_personal_otro.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tipo_personal_otro'],
          message: 'Especifique su tipo de personal (mínimo 3 caracteres)'
        });
      }
    }

    // Si forma parte de un comité, es obligatorio seleccionar cuál
    if (data.forma_parte_comite === true) {
      if (!data.comite || data.comite.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['comite'],
          message: 'Debe seleccionar el comité o vocería a la que pertenece'
        });
      } else if (data.comite === 'Otro (especifique)') {
        if (!data.comite_otro || data.comite_otro.trim().length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['comite_otro'],
            message: 'Especifique el nombre del comité / vocería'
          });
        }
      }
    }
  });
