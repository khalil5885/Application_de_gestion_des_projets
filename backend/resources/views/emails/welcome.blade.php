<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 30px;">
    <h2>Bienvenue, {{ $user->name }} !</h2>
    <p>Votre compte a été créé sur <strong>Project Manager</strong>.</p>
    <p>Cliquez sur le bouton ci-dessous pour configurer votre mot de passe :</p>
    <a href="{{ $setupUrl }}"
       style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">
        Configurer mon mot de passe
    </a>
    <p style="margin-top:20px;color:#666;">Ce lien expire dans 7 jours.</p>
</body>
</html>
