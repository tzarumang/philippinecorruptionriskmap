export { isPseudoLocation, normalisePlaceName } from './normalise';
export {
  parseImplementingOffice,
  stripOfficeDecoration,
  type ImplementingOffice,
  type OfficeKind,
} from './implementing-office';
export { trigramSimilarity, trigrams } from './trigram';
export {
  buildSpineIndex,
  QUARANTINE_THRESHOLD,
  resolvePlace,
  type ResolveInput,
  type SpineIndex,
} from './match';
