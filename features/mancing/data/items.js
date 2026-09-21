const OTHER_ITEMS = [
    /Kerang/i,
    /Ikan Kecil/i,
    /Ikan Tropis/i,
    /Udang/i,
    /Lobster/i,
    /Kepiting(?!.*(Obsidian|Terkutuk))/i,
    /Belut Laut/i,
    /Penyu/i,
    /Gurita/i,
    /Cumi Raksasa/i,
    /Ubur.?ubur Raksasa(?!.*Dewi)/i,
    /Anjing Laut/i,
    /Hiu Putih(?!.*(Obsidian|Terkutuk))/i,
    /Lumba.?lumba(?!.*(Obsidian|Nimbus|Terkutuk))/i,
    /Paus(?!.*Dwiwarna)/i,
    /Putri Duyung(?!.*Jiaoren)/i,
    /Duyung(?!.*(Aurora|Jiaoren))/i,
    /Pangeran Duyung/i,
];

const ARTIFACTS = [
    /Trisu?la Poseidon/i,
    /Kotak Coklat/i,
    /Ketupat Raja Namrud/i,
    /Poke Ball/i,
    /Bola FIFA/i,
    /Prasasti KDMP/i
];

module.exports = {
    OTHER_ITEMS,
    ARTIFACTS,
};
