Team consists of: Charles Boudousquie and Timothy Hew


1. What did you learned or what insight did you gained about simulation dashboards?
They are difficult to make and slow to test given depending on 
how many different variables the user can adjust. The more 
variables the more things can go wrong. 

2. What is your experience with D3? What went well? What did not go well?
We realized that d3.select() automatically creates an element 
if it doesn't exist rather than throwing an error. The x axis 
kept dissapearing until we realized the borders of the svg 
were wrong. We learned that D3 when selecting an element will 
by default create a new one if it doesn't exist rather
than throwing an error. It is extremely permissive/forgiving 
in its behavior which is quite different from what we are used 
to in C++.

3. Given 1.5x multiplier and 10% chance of blowing up each trial, if you had $100,000 (multiply input/output numbers by 1000 in your head) what percent of your money would you bet in each of 20 trials? Why?
From the simulation it seems 46% has the best outcome as going past that results in a trend where more and more of the data points
go towards zero. The "big" winnings bins reduce in size the further past 46% you go.
The majority of the results revolved around these: 2.3 million, 5.3 million, 12.1 million, 27.57 million, and 62.82 million.