import React, { useState } from 'react';
import { exportExcel } from '../services/api';

export default function ExportButton({ filtros = {}, municipio, textoPersonalizado, className }) {
  const [descargando, setDescargando] = useState(false);

  const munActivo = municipio || filtros?.municipio || '';

  const handleDescargar = async () => {
    try {
      setDescargando(true);
      const params = {
        ...filtros,
        ...(munActivo ? { municipio: munActivo } : {})
      };

      const res = await exportExcel(params);

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const nombreArchivo = munActivo
        ? `SISEDGUA_Resumen_${munActivo}_${filtros?.desde || 'inicio'}_al_${filtros?.hasta || 'cierre'}.xlsx`
        : `SISEDGUA_Resumen_Estadal_${filtros?.desde || 'inicio'}_al_${filtros?.hasta || 'cierre'}.xlsx`;
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Ocurrió un error al generar la exportación de Excel.');
    } finally {
      setDescargando(false);
    }
  };

  const textoBoton = textoPersonalizado || (
    munActivo ? `Excel de ${munActivo}` : 'Descargar Excel Completo'
  );

  return (
    <button
      type="button"
      onClick={handleDescargar}
      disabled={descargando}
      className={className || "bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"}
      title={munActivo ? `Exportar informe y resúmenes de ${munActivo}` : "Exportar consolidado estadal y resúmenes de todos los municipios"}
    >
      {descargando ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Generando Excel...</span>
        </>
      ) : (
        <>
          <span>📥</span>
          <span>{textoBoton}</span>
        </>
      )}
    </button>
  );
}
