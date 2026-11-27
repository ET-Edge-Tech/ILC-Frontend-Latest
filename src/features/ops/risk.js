// Health colours from the Operations Console design, with plain words instead of Red / Amber / Green.
// The keys (Green, Amber, Red) are what the server sends; only the words shown on screen change.
export const RISK = {
  Green: {
    dot: 'bg-[#4A7A5D]',
    soft: 'bg-[#4A7A5D]/10',
    text: 'text-[#3C6A4F]',
    solid: 'bg-[#4A7A5D] text-white',
    label: 'Doing well',
    hint: 'Nothing needs doing right now',
  },
  Amber: {
    dot: 'bg-[#B9832E]',
    soft: 'bg-[#B9832E]/12',
    text: 'text-[#9A6A1E]',
    solid: 'bg-[#B9832E] text-white',
    label: 'Needs a check-in',
    hint: 'A friendly call would help',
  },
  Red: {
    dot: 'bg-[#A8483B]',
    soft: 'bg-[#A8483B]/10',
    text: 'text-[#A8483B]',
    solid: 'bg-[#A8483B] text-white',
    label: 'Needs attention now',
    hint: 'Please reach out today',
  },
};
