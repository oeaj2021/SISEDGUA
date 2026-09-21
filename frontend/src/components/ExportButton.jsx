import React, { useState } from 'react';
import { exportExcel } from '../services/api';

export default function ExportButton({ filtros }) {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = async () => {
    try {
      setDescargando(true);
      const res = await exportExcel(filtros);

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const nombreArchivo = `SISEDGUA_Reporte_${filtros.desde || 'consolidado'}_al_${filtros.hasta || 'cierre'}.xlsx`;
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

  return (
    <button
      type="button"
      onClick={handleDescargar}
      disabled={descargando}
      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
    >
      {descargando ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Generando Excel...</span>
        </>
      ) : (
        <>
          <span>📥</span>
          <span>Descargar Excel Ordenado</span>
        </>
      )}
    </button>
  );
}
