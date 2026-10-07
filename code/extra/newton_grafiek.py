# Newton-Raphson in beeld (bij opgave 4)
#
# We tekenen de grafiek van f(t) = 3*t*exp(-t/2) - 1 en de stappen van
# Newton-Raphson: vanuit p ga je recht omhoog (of omlaag) naar de grafiek,
# en dan langs de raaklijn terug naar de t-as. Daar ligt de nieuwe p.

import math
import matplotlib.pyplot as plt

def f(t):
    return 3 * t * math.exp(-t / 2) - 1

def df(t):        # de afgeleide f'
    return 3 * math.exp(-t / 2) * (1 - t / 2)

p0 = 8.0          # startwaarde
stappen = 3       # aantal stappen van Newton-Raphson

# de grafiek van f, als losse punten die we met lijntjes verbinden
t_lijst = []
f_lijst = []
t = -2.0
while t <= 14:
    t_lijst.append(t)
    f_lijst.append(f(t))
    t = t + 0.05
plt.plot(t_lijst, f_lijst)
plt.axhline(0, color="black", linewidth=0.8)

# de stappen van Newton-Raphson
p = p0
print(f"p_0 = {p:.6f}")
for n in range(1, stappen + 1):
    p_nieuw = p - f(p) / df(p)
    plt.plot([p, p], [0, f(p)], "k:")            # naar de grafiek
    plt.plot([p, p_nieuw], [f(p), 0], "r-")      # langs de raaklijn
    plt.plot(p, 0, "ro")
    print(f"p_{n} = {p_nieuw:.6f}")
    p = p_nieuw

plt.xlim(-2, 14)
plt.ylim(-2, 1.5)
plt.xlabel("t (uren)")
plt.ylabel("f(t)")
plt.show()
