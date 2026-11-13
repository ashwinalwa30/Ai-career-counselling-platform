"""Weight constants for the 4-part career recommendation engine.

All components are combined into a final unrounded score (0-100).
If any component is missing (e.g. no subject marks or no stated interests),
its weight is dropped and the remaining weights are rescaled to sum to 1.0.
"""

from __future__ import annotations

W_INTEREST: float = 0.40
W_APTITUDE: float = 0.40
W_ACADEMIC: float = 0.12
W_STATED: float = 0.08

