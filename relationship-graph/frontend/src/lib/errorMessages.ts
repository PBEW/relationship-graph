/**
 * The API speaks English and the UI speaks Thai. Every message the backend can
 * send is translated here, and anything unknown falls back on the HTTP status,
 * so raw English (or a framework's default error text) never reaches a user.
 */

/** Exact messages raised in backend/app/services and backend/app/utils. */
const EXACT_MESSAGES: Record<string, string> = {
  "Invalid username or password": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  "This account has been disabled": "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแล",
  "Too many attempts. Please wait a minute and try again.":
    "ลองหลายครั้งเกินไป กรุณารอสักหนึ่งนาทีแล้วลองใหม่",
  "Authorization token required": "กรุณาเข้าสู่ระบบก่อน",
  "Invalid token": "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
  "Token has expired": "หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่",
  "Token has been revoked": "ออกจากระบบแล้ว กรุณาเข้าสู่ระบบใหม่",
  "Super admin access required": "ส่วนนี้ใช้ได้เฉพาะผู้ดูแลระบบ",
  "Person not found": "ไม่พบคนนี้ อาจถูกลบไปแล้ว",
  "Relationship not found": "ไม่พบความสัมพันธ์นี้ อาจถูกลบไปแล้ว",
  "Relationship type not found": "ไม่พบประเภทความสัมพันธ์นี้ อาจถูกลบไปแล้ว",
  "User not found": "ไม่พบบัญชีผู้ใช้นี้ อาจถูกลบไปแล้ว",
  "Avatar not found": "ไม่พบรูปโปรไฟล์นี้",
  "Resource not found": "ไม่พบข้อมูลที่ต้องการ",
  "Resource conflict": "ข้อมูลนี้ขัดแย้งกับข้อมูลที่มีอยู่",
  "These two already have an active relationship of this type. End the existing one first, or pick a different type.":
    "สองคนนี้มีความสัมพันธ์ประเภทนี้อยู่แล้ว ให้จบอันเดิมก่อน หรือเลือกประเภทอื่น",
  "person_a_id does not exist": "ไม่พบคนที่ 1 กรุณาเลือกใหม่",
  "person_b_id does not exist": "ไม่พบคนที่ 2 กรุณาเลือกใหม่",
  "relationship_type_id does not exist": "ไม่พบประเภทความสัมพันธ์นี้ กรุณาเลือกใหม่",
  "Cannot delete a relationship type that is currently in use":
    "ลบประเภทนี้ไม่ได้ เพราะยังมีความสัมพันธ์ที่ใช้อยู่",
  "Cannot remove the last active super admin":
    "ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อยหนึ่งคน จึงเปลี่ยนบัญชีนี้ไม่ได้",
  "Cannot delete the last active super admin":
    "ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อยหนึ่งคน จึงลบบัญชีนี้ไม่ได้",
  "Cannot delete your own account": "ลบบัญชีของตัวเองไม่ได้",
  "No file provided": "กรุณาเลือกไฟล์รูปก่อน",
  "File is not a valid image": "ไฟล์นี้ไม่ใช่รูปภาพที่ใช้ได้ กรุณาเลือกไฟล์อื่น",
  "Validation failed": "ข้อมูลบางช่องไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่",
  "Database constraint violated": "ข้อมูลนี้ซ้ำหรือขัดแย้งกับข้อมูลที่มีอยู่",
  "Database error": "ฐานข้อมูลมีปัญหา กรุณาลองใหม่อีกครั้ง",
  "Internal server error": "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง",
};

/** Messages with a value inside them, e.g. "Username 'bob' is already taken". */
const PATTERN_MESSAGES: { pattern: RegExp; toThai: (match: RegExpExecArray) => string }[] = [
  {
    pattern: /^Relationship type '(.*)' already exists$/,
    toThai: ([, name]) => `มีประเภทความสัมพันธ์ชื่อ "${name}" อยู่แล้ว`,
  },
  {
    pattern: /^Username '(.*)' is already taken$/,
    toThai: ([, name]) => `ชื่อผู้ใช้ "${name}" มีคนใช้แล้ว`,
  },
  {
    pattern: /^File type not allowed\./,
    toThai: () => "ใช้ได้เฉพาะไฟล์รูป PNG, JPG, GIF หรือ WebP",
  },
];

const STATUS_MESSAGES: Record<number, string> = {
  400: "ส่งข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่",
  401: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
  403: "คุณไม่มีสิทธิ์ทำรายการนี้",
  404: "ไม่พบข้อมูลที่ต้องการ อาจถูกลบไปแล้ว",
  409: "ข้อมูลนี้ขัดแย้งกับข้อมูลที่มีอยู่",
  413: "ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กลง",
  422: "ข้อมูลบางช่องไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่",
  429: "ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
};

export const NETWORK_ERROR_MESSAGE = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่";
export const SERVER_ERROR_MESSAGE = "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง";
export const UNKNOWN_ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

/**
 * Picks the Thai sentence for an API failure. `status` is undefined when no
 * response came back at all, which means the request never reached the server.
 */
export function toThaiErrorMessage(message: string | undefined, status: number | undefined): string {
  if (message) {
    const exact = EXACT_MESSAGES[message];
    if (exact) return exact;
    for (const { pattern, toThai } of PATTERN_MESSAGES) {
      const match = pattern.exec(message);
      if (match) return toThai(match);
    }
  }
  if (status === undefined) return NETWORK_ERROR_MESSAGE;
  if (status >= 500) return SERVER_ERROR_MESSAGE;
  return STATUS_MESSAGES[status] ?? UNKNOWN_ERROR_MESSAGE;
}
