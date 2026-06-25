@php($firstName = trim(explode(' ', $user->name ?? '')[0] ?? ''))
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Confirma tu correo · Capuchino</title>
    <!--[if mso]><style>* { font-family: Georgia, serif !important; }</style><![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#F4ECE3; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

    <!-- Preheader (oculto) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#F4ECE3; font-size:1px; line-height:1px;">
        Falta un paso: confirma tu correo para empezar con Capuchino. · One step left: confirm your email to start.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4ECE3;">
        <tr>
            <td align="center" style="padding:32px 16px;">

                <!-- Contenedor -->
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

                    <!-- Marca -->
                    <tr>
                        <td align="center" style="padding:8px 0 22px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="vertical-align:middle; padding-right:12px;">
                                        <div style="width:46px; height:46px; background-color:#2A1A0E; border-radius:13px; text-align:center; line-height:46px; font-family:Georgia, 'Times New Roman', serif; font-style:italic; font-size:24px; color:#F4ECE3;">C</div>
                                    </td>
                                    <td style="vertical-align:middle; text-align:left;">
                                        <div style="font-family:Georgia, 'Times New Roman', serif; font-style:italic; font-size:24px; color:#1C1107; line-height:1.1;">Capuchino</div>
                                        <div style="font-family:Helvetica, Arial, sans-serif; font-size:12px; color:#8A6F5C; letter-spacing:.5px;">English Coach</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Tarjeta -->
                    <tr>
                        <td style="background-color:#FFFDFB; border:1px solid #E8DDD4; border-radius:18px; padding:0;">

                            <!-- Franja superior de acento -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr><td style="height:5px; background-color:#C4622D; border-radius:18px 18px 0 0; font-size:0; line-height:0;">&nbsp;</td></tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:40px 44px 36px;">

                                        <h1 style="margin:0 0 16px; font-family:Georgia, 'Times New Roman', serif; font-style:italic; font-weight:normal; font-size:28px; line-height:1.25; color:#6B3F1F;">
                                            {{ $firstName ? "¡Hola, $firstName!" : '¡Te damos la bienvenida!' }}
                                            <span style="color:#A8937F;">·</span>
                                            <span style="font-size:22px; color:#9A7B62;">{{ $firstName ? "Hi, $firstName!" : 'Welcome!' }}</span>
                                        </h1>

                                        <p style="margin:0 0 14px; font-family:Helvetica, Arial, sans-serif; font-size:16px; line-height:1.65; color:#3A2A1C;">
                                            Gracias por unirte a <strong style="color:#1C1107;">Capuchino</strong>. Estás a un clic de
                                            empezar tu camino para dominar el inglés a tu ritmo y con tu propio estilo.
                                        </p>
                                        <p style="margin:0 0 24px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:#7A6450;">
                                            Thanks for joining <strong style="color:#5A4636;">Capuchino</strong>. You're one click away from
                                            starting your journey to master English at your own pace and in your own style.
                                        </p>
                                        <p style="margin:0 0 28px; font-family:Helvetica, Arial, sans-serif; font-size:16px; line-height:1.5; color:#3A2A1C;">
                                            Solo confirma que este correo es tuyo
                                            <span style="color:#9A7B62;">· Just confirm this email is yours:</span>
                                        </p>

                                        <!-- Botón (bulletproof) -->
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                                            <tr>
                                                <td align="center" bgcolor="#6B3F1F" style="border-radius:12px;">
                                                    <a href="{{ $url }}" target="_blank"
                                                       style="display:inline-block; padding:15px 38px; font-family:Helvetica, Arial, sans-serif; font-size:16px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:12px; background-color:#6B3F1F;">
                                                        Confirmar mi correo · Confirm email
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin:0 0 8px; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6; color:#8A6F5C;">
                                            Este enlace caduca en {{ $expireMinutes }} minutos. Si el botón no funciona, copia y pega esta dirección en tu navegador.
                                            <br><span style="color:#A8937F;">This link expires in {{ $expireMinutes }} minutes. If the button doesn't work, copy and paste this address into your browser.</span>
                                        </p>
                                        <p style="margin:0; font-family:'Courier New', Courier, monospace; font-size:12px; line-height:1.5; color:#C4622D; word-break:break-all;">
                                            {{ $url }}
                                        </p>

                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Nota de seguridad -->
                    <tr>
                        <td style="padding:24px 44px 0;">
                            <p style="margin:0; font-family:Helvetica, Arial, sans-serif; font-size:13px; line-height:1.6; color:#8A6F5C; text-align:center;">
                                Si tú no creaste una cuenta en Capuchino, puedes ignorar este mensaje con total tranquilidad.
                                <br><span style="color:#A8937F;">If you didn't create a Capuchino account, you can safely ignore this message.</span>
                            </p>
                        </td>
                    </tr>

                    <!-- Pie -->
                    <tr>
                        <td style="padding:26px 44px 8px; text-align:center;">
                            <div style="font-family:Georgia, 'Times New Roman', serif; font-style:italic; font-size:16px; color:#6B3F1F;">Capuchino</div>
                            <div style="font-family:Helvetica, Arial, sans-serif; font-size:11px; color:#A8937F; margin-top:4px;">
                                Tu coach de inglés personal · Your personal English coach · &copy; {{ date('Y') }}
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
