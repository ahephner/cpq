@isTest
public class test_cpqEOPClone {
@isTest
    static void Test_quickpriceSearch(){
        PageReference pref = Page.oppCloneWithProducts;
        Test.setCurrentPage(pref);
        //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
		//create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        //product creation
        Id pricebookId = Test.getStandardPricebookId();
        
        		//Insert ATS Products To Put into Opportunity we are cloning        
         Product__c r1 = new Product__c();
  		 Product__c r2 = new Product__c();
		 Product__c r3 = new Product__c();
        
		 r1.Product_Name__c='rake';
         r1.Name = 'rake';
     	 r1.Primary_Category__c = 'Chemicals';
     	 r1.Subcategory__c ='Chemicals-Herbicide';
     	 r1.Include_in_Programs__c = True;
     	 r1.Size__c = 1; 
     
     	 r2.Product_Name__c='shovel';
         r2.Name = 'shovel'; 
     	 r2.Primary_Category__c = 'Chemicals';
     	 r2.Subcategory__c = 'Chemicals-Fungicide';
     	 r2.Include_in_Programs__c = True;   
     	 r2.Size__c = 2; 
     	 
         r3.Product_Name__c='sprayer';
         r3.Name = 'sprayer'; 
     	 r3.Primary_Category__c = 'Chemicals';
     	 r3.Subcategory__c = 'Chemicals-Fungicide';
     	 r3.Include_in_Programs__c = True;   
     	 r3.Size__c = 2;
         
        insert r1; 
     	insert r2;
		insert r3; 
                //create EOP opportunity
        opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Closed Won', job_type__c = 'Construction', closedate = myDate);
       //opportunity from the website
        opportunity webopp = new opportunity(name = 'test name2', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Quote(75%)', job_type__c = 'Construction', closedate = myDate,
                                            Description='will be name');
        //insert w/o synced quote
        insert opp;
        insert webopp; 
        
        Opportunity_Product__c prod1 = new Opportunity_Product__c(ATS_Product__c= r1.Id, Opportunity__c=opp.Id,Order_Qty__c=1, Line_Comment__c= 'Comment');
        Opportunity_Product__c prod2 = new Opportunity_Product__c(ATS_Product__c= r2.Id, Opportunity__c=opp.Id,Order_Qty__c=2, Line_Comment__c= 'Comment');
		Opportunity_Product__c prod3 = new Opportunity_Product__c(ATS_Product__c= r3.Id, Opportunity__c=opp.Id,Order_Qty__c=2, Line_Comment__c= 'Comment');
        
        insert prod1;
        insert prod2;
        insert prod3;
         
  //Products that will be added to the cloned opportunity
 //product item
         product2 rake = new product2(name ='rake', IsActive= True, Agency_Pricing__c=false, Floor_Price__c = 100); 
        insert rake; 
        
        PricebookEntry rakepbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=rake.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert rakepbe;  
 //product item
        product2 shovel = new product2(name ='shovel', IsActive= True, Agency_Pricing__c=true, Floor_Price__c=140); 
        insert shovel; 
        
        PricebookEntry shovelpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=shovel.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert shovelpbe; 
//non active product
		product2 sprayer = new product2(name='sprayer', IsActive = False, Agency_Pricing__c =false, Floor_Price__c = 125);
        insert sprayer;
        
        PricebookEntry sprayerpbed = new PricebookEntry(Pricebook2Id = pricebookId, Product2id = sprayer.id,
                                                       unitprice = 125, IsActive = false, UseStandardPrice = false);

        opportunitylineitem web1 = new opportunitylineitem(opportunityid = webopp.id, product2id = rake.Id, PricebookEntryId=rakepbe.id,
                                                          unitprice= 4, quantity= 3, CPQ_Unit_Price__c = 4, CPQ_Margin__c=0.00); 
        insert web1;
        //construct standard controller
        ApexPages.StandardController con = new ApexPages.StandardController(opp);
        ApexPages.StandardController webcon = new ApexPages.StandardController(webopp);
        
        //create the controller
        cpqEOPClone clone = new cpqEOPClone(con);
        cpqEOPClone webclone = new cpqEOPClone(webcon);
        Test.startTest();
            //call the clonemethod
            PageReference method = clone.cloneEOP();
			PageReference webmethod = webclone.cloneEOP();
         test.stopTest();        
		opportunity clonedOp = [select id from opportunity where id =:clone.newOppID];
        system.assertNotEquals(null, clonedOp); 
    }
}