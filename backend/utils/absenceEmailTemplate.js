/**
 * Generates the Amharic email template for 3 consecutive absences.
 * Phone dial links are only shown for kitab stream students.
 */
const buildAbsenceEmail = (student, ustazName) => {
  const isKitab = student.stream === 'kitab';

  const buttonStyle = "display: inline-block; padding: 8px 16px; background-color: #e8f0fe; color: #1a73e8; text-decoration: none; border-radius: 20px; font-weight: bold; border: 1px solid #1a73e8; margin-top: 4px;";

  // Phone section differs based on stream
  const fatherPhoneHtml = isKitab
    ? `<a href="tel:${student.fatherPhone}" style="${buttonStyle}">
             <img src="https://cdn-icons-png.flaticon.com/512/724/724664.png" alt="Call" width="16" height="16" style="vertical-align: middle;">
             <span style="vertical-align: middle; margin-left: 6px;">${student.fatherPhone}</span>
           </a>`
    : `<strong style="font-size: 16px;">${student.fatherPhone}</strong>`;

  const motherPhoneHtml = isKitab
    ? `<a href="tel:${student.motherPhone}" style="${buttonStyle}">
             <img src="https://cdn-icons-png.flaticon.com/512/724/724664.png" alt="Call" width="16" height="16" style="vertical-align: middle;">
             <span style="vertical-align: middle; margin-left: 6px;">${student.motherPhone}</span>
           </a>`
    : `<strong style="font-size: 16px;">${student.motherPhone}</strong>`;

  const subject = `⚠️ ማስጠንቀቂያ: 3 ተከታታይ ቀናት ቅጣት - ${student.fullName}`;

  const text = `ተማሪ ${student.fullName} ከኡስታዝ ${ustazName} ትምህርት 3 ተከታታይ ቀናት ቀርቷል/ቀርታለች። እባክዎ ምክንያቱን ለመጠየቅ ለአባት ${student.fatherPhone} ወይም ለእናት ${student.motherPhone} ይደውሉ።`;

  const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #d32f2f, #b71c1c); padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 20px;">⚠️ የቅጣት ማስጠንቀቂያ</h2>
          <p style="color: #ffcdd2; margin: 5px 0 0 0; font-size: 14px;">3 ተከታታይ ቀናት ቀርቷል/ቀርታለች</p>
        </div>
        
        <div style="padding: 24px;">
          ${student.photo ? `
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${student.photo}?t=${new Date().getTime()}" alt="${student.fullName}" style="width: 150px; height: 150px; border-radius: 8px; object-fit: cover; border: 3px solid #f44336; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
          </div>
          ` : ''}
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            ተማሪ <strong style="color: #d32f2f;">${student.fullName}</strong> ከኡስታዝ 
            <strong style="color: #1565c0;">${ustazName}</strong> ትምህርት 
            <strong>3 ተከታታይ ቀናት ወይም ከዚያ በላይ</strong> ቀርቷል።
          </p>
          
          <p style="font-size: 15px; color: #555; margin-top: 16px;">
            እባክዎ ምክንያቱን ለመጠየቅ ይደውሉ፡
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            ${isKitab ? `
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 12px 16px; border: 1px solid #e0e0e0; font-size: 14px;">
                 📞 <strong>ስልክ ቁጥር:</strong>
              </td>
              <td style="padding: 12px 16px; border: 1px solid #e0e0e0; font-size: 16px;">
                ${fatherPhoneHtml}
              </td>
            </tr>
            ` : `
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 12px 16px; border: 1px solid #e0e0e0; font-size: 14px;">
                 📞 <strong>የአባት ስልክ:</strong>
              </td>
              <td style="padding: 12px 16px; border: 1px solid #e0e0e0; font-size: 16px;">
                ${fatherPhoneHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; border: 1px solid #e0e0e0; font-size: 14px;">
                 📞 <strong>የእናት ስልክ:</strong>
              </td>
              <td style="padding: 12px 16px; border: 1px solid #e0e0e0; font-size: 16px;">
                ${motherPhoneHtml}
              </td>
            </tr>
            `}
          </table>
        </div>
        
        <div style="background-color: #fafafa; padding: 12px 24px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">Ali Medresa - የተማሪ ክትትል ስርዓት</p>
        </div>
      </div>
    `;

  return { subject, text, html };
};

export default buildAbsenceEmail;
