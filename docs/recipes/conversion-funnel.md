# Conversion funnel

Use BarList for an ordered funnel when each stage is a subset of the same starting cohort. Preserve journey order and give every bar the same scale. Display counts as well as rates so small samples stay visible. This recipe supports share of the starting cohort and conversion from the previous stage.

<!-- flood:conversion-funnel -->

The host defines the cohort, date range, unique counting unit and stage order. For rates from the previous stage, the first stage shows count alone. When the denominator is zero, keep the known count visible and omit the undefined rate. If stages use different populations or people can enter mid-journey, compare counts with a regular bar chart and describe what each count represents.

Check equal stages, a zero denominator, a narrow viewport and a filtered cohort. Changing the percentage denominator must leave the bars and raw counts unchanged.
