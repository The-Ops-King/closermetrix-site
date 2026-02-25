/**
 * OBJECTION TYPES
 *
 * Standardized categories for sales objections.
 * The AI processor classifies every objection into one of these types.
 *
 * Each type has an `aliases` array for fuzzy matching — the AI sometimes
 * outputs variations like "Budget" instead of "Financial". The ResponseParser
 * uses these aliases to normalize to the canonical label.
 *
 * TO ADD A NEW TYPE: Add an entry to this array. The AI prompt is built
 * dynamically from this list, so no other code changes are needed.
 *
 * TO REMOVE A TYPE: Remove the entry. Existing data in BigQuery with that
 * type remains, but new objections won't be classified into it.
 */
module.exports = [
  { key: 'financial',     label: 'Financial',           aliases: ['money', 'budget', 'price', 'cost', 'afford', 'expensive', 'payment', 'investment', 'cash', 'funds'],        description: 'Price too high, can\'t afford, budget concerns, payment plan needed' },
  { key: 'spouse',        label: 'Spouse/Partner',      aliases: ['spouse', 'partner', 'wife', 'husband', 'family', 'significant other', 'talk to my'],                          description: 'Need to talk to spouse, partner not on board, family decision' },
  { key: 'think_about',   label: 'Think About It',      aliases: ['think about', 'think it over', 'think on it', 'need time', 'decide later', 'sleep on it', 'consider'],       description: 'Need time to decide, want to think it over, not ready to commit today' },
  { key: 'timing',        label: 'Timing',              aliases: ['timing', 'not the right time', 'too busy', 'wait', 'bad time', 'later', 'not now', 'schedule'],               description: 'Not the right time, too busy, want to wait, bad season' },
  { key: 'trust',         label: 'Trust/Credibility',   aliases: ['trust', 'credibility', 'skepticism', 'skeptical', 'proof', 'believe', 'too good to be true', 'scam', 'legit'], description: 'Skeptical of results, seems too good to be true, want proof' },
  { key: 'already_tried', label: 'Already Tried',       aliases: ['already tried', 'tried before', 'tried something', 'burned', 'past experience', 'didn\'t work before'],       description: 'Tried similar before and it didn\'t work, burned before' },
  { key: 'diy',           label: 'DIY',                 aliases: ['diy', 'do it myself', 'myself', 'on my own', 'don\'t need help', 'self taught', 'figure it out'],              description: 'Can do it myself, don\'t need help, have the skills already' },
  { key: 'not_ready',     label: 'Not Ready',           aliases: ['not ready', 'not prepared', 'not at the right stage', 'need more preparation', 'not there yet'],               description: 'Not at the right stage, need more preparation first' },
  { key: 'competitor',    label: 'Competitor',           aliases: ['competitor', 'competition', 'other options', 'already working with', 'comparing', 'alternative', 'shopping around'], description: 'Considering other options, already working with someone, comparing' },
  { key: 'authority',     label: 'Authority',            aliases: ['authority', 'decision maker', 'boss', 'board', 'approval', 'not my decision', 'need permission'],              description: 'Not the decision maker, need approval from boss/board/partner' },
  { key: 'value',         label: 'Value',                aliases: ['value', 'worth it', 'roi', 'return on investment', 'benefit', 'what do i get', 'results'],                    description: 'Don\'t see the value, not sure it\'s worth it, ROI unclear' },
  { key: 'commitment',    label: 'Commitment',           aliases: ['commitment', 'long term', 'contract', 'locked in', 'flexibility', 'cancel', 'obligation'],                    description: 'Scared of long-term commitment, want flexibility, contract concerns' },
  { key: 'program_fit',   label: 'Program Not a Fit',    aliases: ['not a fit', 'not for me', 'not what i\'m looking for', 'doesn\'t match', 'wrong program', 'not right for me'], description: 'Prospect feels the program isn\'t right for them, not what they\'re looking for, doesn\'t match their needs or goals' },
  { key: 'other',         label: 'Other',                aliases: [],                                                                                                             description: 'Anything not fitting the above categories' },
];
