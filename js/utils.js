// js/utils.js
// Retourne une clé unique pour chaque record, selon la source
export function getRecordKey(source, record) {
  switch (source) {
    case 'Gallica':
      const extraData = record['srw:extraRecordData'];
      if (Array.isArray(extraData)) {
        for (const e of extraData) {
          if (e.uri) return e.uri;
        }
      } else if (extraData && extraData.uri) {
        return extraData.uri;
      }
      // fallback générique si pas d'uri
      return JSON.stringify(record);
    case 'AD31':
    case 'AD65':
    case 'AD81':
      return record.id?.toString() || '';
    default:
      return JSON.stringify(record);
  }
}