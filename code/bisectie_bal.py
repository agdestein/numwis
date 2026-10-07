# Bisectie-methode (paragraaf 4.2)
#
# Een houten bal (straal R = 10 cm, dichtheid 0,65 kg/L) drijft in water.
# Hoe diep ligt de bal in het water? De diepte d voldoet aan (Archimedes):
#
#     f(d) = d^3 - 3*R*d^2 + 4*rho*R^3 = 0
#
# Met R = 10 en rho = 0,65:  f(d) = d^3 - 30 d^2 + 2600.
# De bal ligt ergens tussen d = 0 (bovenop) en d = 2R = 20 (helemaal onder),
# dus we starten met a = 0 en b = 20.

def f(d):
    return d**3 - 30 * d**2 + 2600

a = 0.0
b = 20.0
eps = 0.001   # stop als het interval korter is dan eps

print(" n        p_n       f(p_n)")
n = 0
while b - a > eps:
    n = n + 1
    p = (a + b) / 2
    if f(a) * f(p) > 0:
        a = p     # het nulpunt ligt rechts van p
    else:
        b = p     # het nulpunt ligt links van p
    print(f"{n:2d}   {p:9.5f}   {f(p):10.3f}")

print()
print(f"De bal ligt {p:.2f} cm diep in het water.")
