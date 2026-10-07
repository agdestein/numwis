# Newton-Raphson methode (paragraaf 4.4)
#
# Waar is een komeet (of satelliet) in zijn ellipsbaan op tijdstip t?
# Sinds Kepler (1609) weten we: los eerst de vergelijking van Kepler op,
#
#     E - e*sin(E) = M
#
# met e de excentriciteit van de baan en M een getal dat de tijd aangeeft.
# Voor E bestaat geen formule! Al vier eeuwen lost men dit numeriek op;
# GPS-satellieten doen het vandaag nog steeds. Wij zoeken het nulpunt van
#
#     f(E) = E - e*sin(E) - M
#
# met Newton-Raphson:  p_n = p_{n-1} - f(p_{n-1}) / f'(p_{n-1}).

import math

e = 0.8   # excentriciteit (0 = cirkel, dicht bij 1 = langgerekte ellips)
M = 1.5

def f(E):
    return E - e * math.sin(E) - M

def df(E):        # de afgeleide f'
    return 1 - e * math.cos(E)

p = M             # startwaarde p_0
print(" n   p_n                  |p_n - p_{n-1}|")
print(f" 0   {p:.15f}")
for n in range(1, 7):
    p_oud = p
    p = p - f(p) / df(p)
    print(f"{n:2d}   {p:.15f}   {abs(p - p_oud):.1e}")
