# Bisectie-methode (paragraaf 4.2)
#
# Je leent 1200 euro voor een elektrische fiets en betaalt 24 maanden
# lang 55 euro per maand terug (samen 1320 euro). Welke maandelijkse
# rente r rekent de winkel? De rente voldoet aan de annuiteitenformule:
#
#     f(r) = 55 * (1 - (1 + r)^(-24)) / r - 1200 = 0
#
# Deze vergelijking kun je niet met algebra naar r oplossen -- maar
# bisectie werkt gewoon. De rente ligt ergens tussen 0,01% en 5%.

def f(r):
    return 55 * (1 - (1 + r)**(-24)) / r - 1200

a = 0.0001
b = 0.05
eps = 0.000001

print(" n        p_n        f(p_n)")
n = 0
while b - a > eps:
    n = n + 1
    p = (a + b) / 2
    if f(a) * f(p) > 0:
        a = p
    else:
        b = p
    print(f"{n:2d}   {p:9.6f}   {f(p):10.4f}")

print()
print(f"Maandelijkse rente: {100 * p:.3f}%")
print(f"Dat is per jaar: {100 * ((1 + p)**12 - 1):.2f}%")
