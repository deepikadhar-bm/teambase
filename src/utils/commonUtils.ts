export function formatDate(date: Date, format: string = '-'): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    return formattedDate.replace(/\//g, format);
}

export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function getDateAfterDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

export function formatDateFor(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateEmail(): string {
    const timestamp = Date.now();
    return `test.user.${timestamp}@automation.com`;
}

export function generatePhone(): string {
    return `98${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

export function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export function formatToday(format: string): string {
    const date = new Date();

    const dd = String(date.getDate());
    const mm = String(date.getMonth() + 1);
    const yyyy = String(date.getFullYear());

    return format
        .replace(/dd/g, dd)
        .replace(/mm/g, mm)
        .replace(/yyyy/g, yyyy);
}
export function formatDateAfterDays(days: number, format: string): string {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const dd = String(date.getDate());           // No padStart → gives 1, 2, 3, 10, 11, 12
    const mm = String(date.getMonth() + 1);      // Same here
    const yyyy = String(date.getFullYear());

    return format
        .replace(/dd/g, dd)
        .replace(/mm/g, mm)
        .replace(/yyyy/g, yyyy);
}

export class NumberUtils {

    // 1️⃣ BELOW number generator (random number < given number)
    static getBelow(num: number): number {
        const result = Math.floor(Math.random() * num); // 0 to num-1
        console.log(`Below ${num} → ${result}`);
        return result;
    }

    // 2️⃣ AFTER number generator (random number > given number)
    static getAfter(num: number): number {
        const add = Math.floor(Math.random() * 50) + 1; // add 1 to 50
        const result = num + add;
        console.log(`After ${num} → ${result}`);
        return result;
    }

    // 3️⃣ RANGE generator (random number between given range)
    static getInRange(min: number, max: number): number {
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log(`Between ${min} and ${max} → ${result}`);
        return result;
    }
    
}
export function convertToDDMMYYYY(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${input}`);
    }

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}
export function convertToYYYYMMDD(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${input}`);
    }

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${yyyy}-${mm}-${dd}`;
}
export function cleanAndConvertToDDMMYYYY(input: string): string {

    // 1️⃣ Remove extra spaces & line breaks
    let clean = input.replace(/\s+/g, " ").trim();

    // 2️⃣ Remove apostrophes
    clean = clean.replace(/'/g, "");

    // 3️⃣ Fix missing spaces: 27Nov → 27 Nov  |  Nov2025 → Nov 2025
    clean = clean
        .replace(/(\d{1,2})([A-Za-z]+)/, "$1 $2")   // before month
        .replace(/([A-Za-z]+)(\d{4})/, "$1 $2");    // before year

    // 4️⃣ Extract day + month + year only → STOP after 2025
    const dateMatch = clean.match(/\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/);

    if (!dateMatch) {
        throw new Error(`Could not extract valid date from: ${clean}`);
    }

    const dateOnly = dateMatch[0];  // "27 Nov 2025"

    // 5️⃣ Convert to JS date
    const date = new Date(dateOnly);

    if (isNaN(date.getTime())) {
        throw new Error(`Invalid cleaned date: ${dateOnly}`);
    }

    // 6️⃣ Format to dd/mm/yyyy
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}
