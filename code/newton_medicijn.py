# Newton-Raphson methode (paragraaf 4.4) -- succes EN mislukking
#
# Na het innemen van een medicijn is de concentratie in het bloed
#
#     C(t) = 3*t*exp(-t/2)   (mg per liter, t in uren)
#
# Het medicijn werkt zolang C(t) >= 1. Wanneer zakt de concentratie
# weer onder de 1? We zoeken dus een nulpunt van
#
#     f(t) = 3*t*exp(-t/2) - 1.
#
# Er zijn twee nulpunten: rond t = 0,4 (begint te werken) en rond
# t = 5,7 (uitgewerkt). Probeer verschillende startwaarden p_0 en
# kijk wat er gebeurt!

import math

def f(t):
    return 3 * t * math.exp(-t / 2) - 1

def df(t):        # de afgeleide f'
    return 3 * math.exp(-t / 2) * (1 - t / 2)

eps = 1e-10

for p0 in [6.0, 2.0, 12.0]:
    print(f"startwaarde p_0 = {p0}")
    p = p0
    for n in range(1, 21):
        if df(p) == 0:
            print("     f'(p) = 0: we delen door nul, Newton-Raphson loopt vast!")
            break
        p_oud = p
        p = p - f(p) / df(p)
        print(f"    {n:2d}   {p:16.10f}")
        if abs(p - p_oud) < eps:
            print(f"     klaar na {n} stappen: nulpunt p = {p:.4f}")
            break
    print()
