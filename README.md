<h1 align="center" style="border-bottom: none;">🚀 Smart DOC (Disease Outbreak Control)</h1>
<h3 align="center">System for rabidly detecting and controlling epidemics.</h3>

You can view a [demo][demo_url] of this app.


## Description
Early detection of disease outbreak helps countries in effectively taking precautions actions to control its spread. By early detecting the outbreak it accordingly leads in effectively alerting governments, public/private agencies to plan and manage epidemic control. 

This is a challenging problem for many reasons. First the capacity for monitoring disease outbreak detection is costly. Second: several countries lack adequate infrastructure to identify outbreaks at their earliest stages. Third: how to reach out for different stake holders and build a larger smarter network for diseases outbreak control.

We propose Smart DOC (Disease Outbreak Control). It is a system that makes it easy to detect and control disease outbreaks by involving all stakeholders. Smart DOC architecture leverages the power of artificial intelligence by utilizing a set of IBM Watson services. IT help in connecting different stake holders to help controlling epidemics. Moreover, it educates and enhance end user awareness for how to deal with disease. 

## The system is composed of Six Watson services:
### Three Chatbots using Watson Assistant:
1.  ##### Travelers/Immigrants tracking Chatbot
    to contact the travelers to/from countries affected by outbreaks.
1.  ##### Citizens Awareness and Guidance Chatbot
    to provide awareness of symptoms and precautions of diseases.
1.  ##### Health Sector Chatbot
    collects live data from hospitals and doctors.

1.  ### Watson Knowledge Studio (WKS):
     Train a custom annotator to extract entities related to disease outbreaks, such as: symptoms, precautions, Incubation period, infected areas …etc.
1.  ### Watson Discovery:
    Teach Discovery to apply the knowledge of unique entities and relations extracted with WKS.
1.  ### Watson Studio:
    Train a machine learning model to classify if there is an expected risk of disease outbreak.
1.  ### Geospatial Analytics:
    Monitor device locations and leverage real-time geospatial analytics to track when devices enter, leave or hang out in defined endangered or high-risk regions. Update the “Citizens Guidance chatbot” as the risk factor changes.

## For the application future plans our target is:
1.  Leverage the application in a smart phone version to ease the access for larger set of users.
1.  Enriching the dataset and covering more types of diseases.
1.  Exploit more services like Speech To text and Text to speech to ensure reaching citizens who might not be able to communicate over text. (for example, because of lake of education)
1.  Multilingual support to customize the solution in different countries native language.


[demo_url]: https://smart-doc.eu-gb.mybluemix.net/
